"""Initial enterprise upgrade - enhanced user model and geo indexes

Revision ID: 001_initial_enterprise
Revises: None
Create Date: 2024-01-15 00:00:00.000000

This migration:
- Adds new columns to users table (role, refresh_token, last_login, email_verified, updated_at)
- Adds creator_id and verified_by_id to utilities table
- Adds composite index for geo queries (latitude, longitude)
- Adds index for utility category searches
- Adds is_flagged column to ratings table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_enterprise'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply migration changes."""
    # Get bind to check dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    # =========================================================================
    # Users Table Enhancements
    # =========================================================================

    # Add new columns to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Role column with default 'user'
        batch_op.add_column(
            sa.Column('role', sa.String(20), nullable=False, server_default='user')
        )

        # Refresh token storage (nullable for security rotation)
        batch_op.add_column(
            sa.Column('refresh_token', sa.String(500), nullable=True)
        )

        # Last login tracking
        batch_op.add_column(
            sa.Column('last_login', sa.DateTime, nullable=True)
        )

        # Email verification status
        batch_op.add_column(
            sa.Column('email_verified', sa.Boolean, nullable=False, server_default='false')
        )

        # Updated timestamp
        batch_op.add_column(
            sa.Column('updated_at', sa.DateTime, nullable=True)
        )

        # Add index on role for RBAC queries
        batch_op.create_index('ix_users_role', ['role'])

        # Add index on email_verified for filtering
        batch_op.create_index('ix_users_email_verified', ['email_verified'])

    # =========================================================================
    # Utilities Table Enhancements
    # =========================================================================

    with op.batch_alter_table('utilities', schema=None) as batch_op:
        # Creator tracking
        batch_op.add_column(
            sa.Column('creator_id', sa.Integer, nullable=True)
        )

        # Admin verification tracking
        batch_op.add_column(
            sa.Column('verified_by_id', sa.Integer, nullable=True)
        )

        # View count for analytics
        batch_op.add_column(
            sa.Column('view_count', sa.Integer, nullable=False, server_default='0')
        )

        # Report count for moderation
        batch_op.add_column(
            sa.Column('report_count', sa.Integer, nullable=False, server_default='0')
        )

        # Denormalized rating stats
        batch_op.add_column(
            sa.Column('average_rating', sa.Float, nullable=True)
        )
        batch_op.add_column(
            sa.Column('rating_count', sa.Integer, nullable=False, server_default='0')
        )

        # Foreign key to users table (if exists)
        try:
            batch_op.create_foreign_key(
                'fk_utilities_creator_id',
                'users',
                ['creator_id'],
                ['id'],
                ondelete='SET NULL'
            )
            batch_op.create_foreign_key(
                'fk_utilities_verified_by_id',
                'users',
                ['verified_by_id'],
                ['id'],
                ondelete='SET NULL'
            )
        except Exception:
            # Foreign keys may not be supported (SQLite) or already exist
            pass

        # Composite index for geo queries (latitude, longitude)
        # This dramatically speeds up bounding box queries
        batch_op.create_index(
            'ix_utilities_geo',
            ['latitude', 'longitude']
        )

        # Index for category-based searches
        batch_op.create_index(
            'ix_utilities_category',
            ['category']
        )

        # Index for verified utilities
        batch_op.create_index(
            'ix_utilities_verified',
            ['verified']
        )

    # =========================================================================
    # Ratings Table Enhancements
    # =========================================================================

    with op.batch_alter_table('ratings', schema=None) as batch_op:
        # Flag for moderation
        batch_op.add_column(
            sa.Column('is_flagged', sa.Boolean, nullable=False, server_default='false')
        )

        # Index for finding flagged ratings
        batch_op.create_index('ix_ratings_is_flagged', ['is_flagged'])

        # Index for utility's ratings
        batch_op.create_index('ix_ratings_utility_id', ['utility_id'])

        # Index for user's ratings
        batch_op.create_index('ix_ratings_user_id', ['user_id'])

    # =========================================================================
    # Utility Reports Table (New)
    # =========================================================================

    op.create_table(
        'utility_reports',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('utility_id', sa.String(50), sa.ForeignKey('utilities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reason', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('reviewed_at', sa.DateTime, nullable=True),
        sa.Column('reviewed_by_id', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )

    # Indexes for utility reports
    op.create_index('ix_utility_reports_utility_id', 'utility_reports', ['utility_id'])
    op.create_index('ix_utility_reports_status', 'utility_reports', ['status'])
    op.create_index('ix_utility_reports_user_id', 'utility_reports', ['user_id'])

    # =========================================================================
    # PostgreSQL-specific: Full-text search indexes
    # =========================================================================

    if dialect == 'postgresql':
        # Full-text search index on utility name and description
        op.execute("""
            CREATE INDEX IF NOT EXISTS ix_utilities_fulltext
            ON utilities
            USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))
        """)


def downgrade() -> None:
    """Revert migration changes."""
    # Get bind to check dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Drop PostgreSQL full-text index
    if dialect == 'postgresql':
        op.execute("DROP INDEX IF EXISTS ix_utilities_fulltext")

    # Drop utility reports table
    op.drop_index('ix_utility_reports_user_id', table_name='utility_reports')
    op.drop_index('ix_utility_reports_status', table_name='utility_reports')
    op.drop_index('ix_utility_reports_utility_id', table_name='utility_reports')
    op.drop_table('utility_reports')

    # Revert ratings table
    with op.batch_alter_table('ratings', schema=None) as batch_op:
        batch_op.drop_index('ix_ratings_user_id')
        batch_op.drop_index('ix_ratings_utility_id')
        batch_op.drop_index('ix_ratings_is_flagged')
        batch_op.drop_column('is_flagged')

    # Revert utilities table
    with op.batch_alter_table('utilities', schema=None) as batch_op:
        batch_op.drop_index('ix_utilities_verified')
        batch_op.drop_index('ix_utilities_category')
        batch_op.drop_index('ix_utilities_geo')

        try:
            batch_op.drop_constraint('fk_utilities_verified_by_id', type_='foreignkey')
            batch_op.drop_constraint('fk_utilities_creator_id', type_='foreignkey')
        except Exception:
            pass

        batch_op.drop_column('rating_count')
        batch_op.drop_column('average_rating')
        batch_op.drop_column('report_count')
        batch_op.drop_column('view_count')
        batch_op.drop_column('verified_by_id')
        batch_op.drop_column('creator_id')

    # Revert users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_email_verified')
        batch_op.drop_index('ix_users_role')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('email_verified')
        batch_op.drop_column('last_login')
        batch_op.drop_column('refresh_token')
        batch_op.drop_column('role')
