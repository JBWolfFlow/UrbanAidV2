"""
Models Package for UrbanAid API

This package contains SQLAlchemy ORM models for:
- User: User accounts with authentication and RBAC
- Utility: Social service and utility locations
- UtilityReport: User reports on utilities for moderation
- Rating: User ratings and reviews for utilities

Database configuration and session management are in database.py.
"""

from .database import Base, engine, SessionLocal, get_db, init_db, DATABASE_URL
from .user import User, UserRole
from .utility import Utility, UtilityReport
from .rating import Rating


__all__ = [
    # Database
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "DATABASE_URL",

    # Models
    "User",
    "UserRole",
    "Utility",
    "UtilityReport",
    "Rating",
]
