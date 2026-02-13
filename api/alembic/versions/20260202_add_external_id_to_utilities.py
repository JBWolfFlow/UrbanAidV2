"""Add external_id column to utilities table

Revision ID: 002_add_external_id
Revises: 001_initial_enterprise
Create Date: 2026-02-02 00:00:00.000000

Stores external source identifiers (e.g., OneBusAway stop IDs like "1_12345")
so we can correlate our utilities with third-party transit APIs.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_external_id'
down_revision: Union[str, None] = '001_initial_enterprise'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add external_id column with index."""
    with op.batch_alter_table('utilities', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('external_id', sa.String(100), nullable=True)
        )
        batch_op.create_index(
            'ix_utilities_external_id',
            ['external_id']
        )


def downgrade() -> None:
    """Remove external_id column."""
    with op.batch_alter_table('utilities', schema=None) as batch_op:
        batch_op.drop_index('ix_utilities_external_id')
        batch_op.drop_column('external_id')
