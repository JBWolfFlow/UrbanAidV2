"""
User Controller for Authentication and User Management

This controller provides:
- User registration with duplicate checking
- Authentication with password verification
- User CRUD operations
- Password management
- Role-based operations
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.user import User, UserRole
from schemas.user import (
    UserCreate, UserUpdate, UserRoleUpdate, PasswordChange,
    UserResponse, UserListResponse, TokenResponse
)
from utils.auth import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.exceptions import (
    UserNotFoundError, UserAlreadyExistsError,
    UsernameAlreadyExistsError, EmailAlreadyExistsError,
    InvalidCredentialsError, InactiveUserError,
    PasswordMismatchError, InvalidPasswordError
)


class UserController:
    """Controller for user-related operations"""

    # =========================================================================
    # User Retrieval Methods
    # =========================================================================

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """
        Retrieve a user by their ID.

        Args:
            db: Database session
            user_id: User's primary key

        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(User.id == user_id).first()

    def get_user_by_username(self, db: Session, username: str) -> Optional[User]:
        """
        Retrieve a user by their username.

        Args:
            db: Database session
            username: User's username

        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.

        Args:
            db: Database session
            email: User's email address

        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(User.email == email).first()

    def get_user_by_username_or_email(self, db: Session, identifier: str) -> Optional[User]:
        """
        Retrieve a user by username or email (for login flexibility).

        Args:
            db: Database session
            identifier: Username or email address

        Returns:
            User object if found, None otherwise
        """
        return db.query(User).filter(
            or_(User.username == identifier, User.email == identifier)
        ).first()

    def get_users(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """
        Retrieve paginated list of users with optional filters.

        Args:
            db: Database session
            skip: Number of records to skip (pagination offset)
            limit: Maximum number of records to return
            role: Filter by user role
            is_active: Filter by active status

        Returns:
            List of User objects
        """
        query = db.query(User)

        if role is not None:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        return query.offset(skip).limit(limit).all()

    def count_users(
        self,
        db: Session,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        """Count total users matching filters."""
        query = db.query(User)

        if role is not None:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        return query.count()

    # =========================================================================
    # User Creation
    # =========================================================================

    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """
        Create a new user account.

        Performs duplicate checking for username and email,
        hashes the password, and persists the user.

        Args:
            db: Database session
            user_data: User registration data

        Returns:
            Created User object

        Raises:
            UsernameAlreadyExistsError: If username is taken
            EmailAlreadyExistsError: If email is registered
        """
        # Check for existing username
        if self.get_user_by_username(db, user_data.username):
            raise UsernameAlreadyExistsError()

        # Check for existing email
        if self.get_user_by_email(db, user_data.email):
            raise EmailAlreadyExistsError()

        # Create user with hashed password
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            role=UserRole.USER.value,
            is_active=True,
            email_verified=False
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    # =========================================================================
    # Authentication
    # =========================================================================

    def authenticate_user(
        self,
        db: Session,
        username: str,
        password: str
    ) -> tuple[User, TokenResponse]:
        """
        Authenticate a user and generate tokens.

        Verifies credentials, checks account status, updates last login,
        and generates access/refresh tokens.

        Args:
            db: Database session
            username: Username or email
            password: Plain text password

        Returns:
            Tuple of (User object, TokenResponse with tokens)

        Raises:
            InvalidCredentialsError: If credentials are invalid
            InactiveUserError: If account is deactivated
        """
        # Find user by username or email
        user = self.get_user_by_username_or_email(db, username)

        if not user:
            raise InvalidCredentialsError()

        # Verify password
        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()

        # Check if account is active
        if not user.is_active:
            raise InactiveUserError()

        # Update last login timestamp
        user.last_login = datetime.now(timezone.utc)

        # Generate tokens
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"user_id": user.id})

        # Store refresh token for rotation/revocation
        user.refresh_token = refresh_token

        db.commit()

        return user, TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def refresh_tokens(
        self,
        db: Session,
        user_id: int,
        current_refresh_token: str
    ) -> TokenResponse:
        """
        Refresh access token using a valid refresh token.

        Implements token rotation: old refresh token is invalidated
        and a new one is issued.

        Args:
            db: Database session
            user_id: User ID from the refresh token
            current_refresh_token: The current refresh token

        Returns:
            TokenResponse with new tokens

        Raises:
            InvalidCredentialsError: If refresh token is invalid
            InactiveUserError: If account is deactivated
        """
        user = self.get_user_by_id(db, user_id)

        if not user:
            raise InvalidCredentialsError()

        # Verify the refresh token matches stored token (prevents reuse)
        if user.refresh_token != current_refresh_token:
            raise InvalidCredentialsError("Invalid or revoked refresh token")

        if not user.is_active:
            raise InactiveUserError()

        # Generate new tokens
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }

        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token({"user_id": user.id})

        # Rotate refresh token
        user.refresh_token = new_refresh_token
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def logout_user(self, db: Session, user_id: int) -> bool:
        """
        Log out a user by invalidating their refresh token.

        Args:
            db: Database session
            user_id: User's ID

        Returns:
            True if successful
        """
        user = self.get_user_by_id(db, user_id)
        if user:
            user.refresh_token = None
            db.commit()
            return True
        return False

    # =========================================================================
    # User Updates
    # =========================================================================

    def update_user(
        self,
        db: Session,
        user_id: int,
        updates: UserUpdate
    ) -> User:
        """
        Update user profile information.

        Args:
            db: Database session
            user_id: User's ID
            updates: Fields to update

        Returns:
            Updated User object

        Raises:
            UserNotFoundError: If user doesn't exist
            UsernameAlreadyExistsError: If new username is taken
            EmailAlreadyExistsError: If new email is registered
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        # Check username uniqueness if changing
        if updates.username and updates.username != user.username:
            existing = self.get_user_by_username(db, updates.username)
            if existing:
                raise UsernameAlreadyExistsError()
            user.username = updates.username

        # Check email uniqueness if changing
        if updates.email and updates.email != user.email:
            existing = self.get_user_by_email(db, updates.email)
            if existing:
                raise EmailAlreadyExistsError()
            user.email = updates.email
            user.email_verified = False  # Require re-verification

        db.commit()
        db.refresh(user)
        return user

    def update_user_role(
        self,
        db: Session,
        user_id: int,
        role_update: UserRoleUpdate,
        admin_user_id: int
    ) -> User:
        """
        Update a user's role (admin only).

        Args:
            db: Database session
            user_id: Target user's ID
            role_update: New role data
            admin_user_id: ID of admin making the change

        Returns:
            Updated User object

        Raises:
            UserNotFoundError: If user doesn't exist
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        user.role = role_update.role.value
        db.commit()
        db.refresh(user)
        return user

    # =========================================================================
    # Password Management
    # =========================================================================

    def change_password(
        self,
        db: Session,
        user_id: int,
        password_data: PasswordChange
    ) -> bool:
        """
        Change a user's password (requires current password).

        Args:
            db: Database session
            user_id: User's ID
            password_data: Current and new password

        Returns:
            True if successful

        Raises:
            UserNotFoundError: If user doesn't exist
            InvalidCredentialsError: If current password is wrong
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        # Verify current password
        if not verify_password(password_data.current_password, user.hashed_password):
            raise InvalidCredentialsError("Current password is incorrect")

        # Update password
        user.hashed_password = get_password_hash(password_data.new_password)

        # Invalidate refresh token (force re-login on other devices)
        user.refresh_token = None

        db.commit()
        return True

    # =========================================================================
    # Account Status
    # =========================================================================

    def deactivate_user(self, db: Session, user_id: int) -> bool:
        """
        Deactivate a user account.

        Args:
            db: Database session
            user_id: User's ID

        Returns:
            True if successful

        Raises:
            UserNotFoundError: If user doesn't exist
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        user.is_active = False
        user.refresh_token = None  # Invalidate tokens
        db.commit()
        return True

    def activate_user(self, db: Session, user_id: int) -> bool:
        """
        Reactivate a user account (admin only).

        Args:
            db: Database session
            user_id: User's ID

        Returns:
            True if successful

        Raises:
            UserNotFoundError: If user doesn't exist
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        user.is_active = True
        db.commit()
        return True

    def verify_email(self, db: Session, user_id: int) -> bool:
        """
        Mark a user's email as verified.

        Args:
            db: Database session
            user_id: User's ID

        Returns:
            True if successful
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundError()

        user.email_verified = True
        db.commit()
        return True


# Singleton instance for dependency injection
user_controller = UserController()
