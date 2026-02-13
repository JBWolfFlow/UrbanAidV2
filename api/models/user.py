"""
User Model for Authentication and User Management

This model supports:
- Role-based access control (user, moderator, admin)
- Refresh token storage for token rotation
- Login tracking and audit fields
- Email verification workflow
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from .database import Base


class UserRole(str, enum.Enum):
    """User role enumeration for RBAC"""
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class User(Base):
    """
    User account model for authentication and authorization.

    Attributes:
        id: Primary key
        username: Unique username for login
        email: Unique email address
        hashed_password: Bcrypt password hash
        role: User role for access control
        is_active: Whether account is active
        email_verified: Whether email has been verified
        refresh_token: Current refresh token (for rotation/revocation)
        last_login: Timestamp of last successful login
        created_at: Account creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "users"

    # Primary identification
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Role-based access control
    role = Column(
        String(20),
        default=UserRole.USER.value,
        nullable=False,
        index=True
    )

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

    # Token management (for refresh token rotation and revocation)
    refresh_token = Column(Text, nullable=True)

    # Audit timestamps
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (to be defined as needed)
    # ratings = relationship("Rating", back_populates="user")
    # utilities = relationship("Utility", back_populates="creator")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return self.role == UserRole.ADMIN.value

    @property
    def is_moderator(self) -> bool:
        """Check if user has moderator or admin role"""
        return self.role in (UserRole.MODERATOR.value, UserRole.ADMIN.value)

    def can_modify_utility(self, utility) -> bool:
        """
        Check if user can modify a utility.

        Users can modify utilities they created.
        Moderators and admins can modify any utility.
        """
        if self.is_moderator:
            return True
        # Assuming utility has a creator_id field
        return hasattr(utility, 'creator_id') and utility.creator_id == self.id

    def can_delete_utility(self, utility) -> bool:
        """
        Check if user can delete a utility.

        Only the creator or admins can delete utilities.
        Moderators can soft-delete (mark as inactive).
        """
        if self.is_admin:
            return True
        return hasattr(utility, 'creator_id') and utility.creator_id == self.id
