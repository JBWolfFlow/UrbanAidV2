"""
Database Configuration and Session Management

Supports multiple database backends:
- SQLite (development): Default, file-based
- PostgreSQL (production): Full-featured with advanced indexing

Environment Variables:
- DATABASE_URL: Database connection string

Example URLs:
- SQLite: sqlite:///./urbanaid.db
- PostgreSQL: postgresql://user:password@localhost:5432/urbanaid
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import logging

logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./urbanaid.db")

# Handle Heroku-style postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def _get_engine_kwargs():
    """Get engine configuration based on database type."""
    kwargs = {}

    if "sqlite" in DATABASE_URL:
        # SQLite-specific configuration
        kwargs["connect_args"] = {"check_same_thread": False}
        # For testing, use StaticPool to share connection across threads
        if ":memory:" in DATABASE_URL:
            kwargs["poolclass"] = StaticPool
    else:
        # PostgreSQL configuration
        kwargs["pool_pre_ping"] = True  # Verify connections before use
        kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
        kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        kwargs["pool_recycle"] = 3600  # Recycle connections after 1 hour

    return kwargs


# Create database engine
engine = create_engine(DATABASE_URL, **_get_engine_kwargs())

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()


# Enable foreign key constraints for SQLite
if "sqlite" in DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db():
    """
    Get database session.

    Yields a database session and ensures proper cleanup.
    Use as a FastAPI dependency:

        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.

    Creates all tables defined in models. For production,
    use Alembic migrations instead:

        alembic upgrade head
    """
    # Import all models here to ensure they are registered
    from . import utility, user, rating
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database initialized: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")


def check_db_connection():
    """
    Check if database connection is working.

    Returns:
        bool: True if connection successful, False otherwise.
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False 