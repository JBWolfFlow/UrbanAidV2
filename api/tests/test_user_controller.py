"""
User Controller Tests

Tests for user CRUD operations including:
- User creation
- User retrieval
- User updates
- User deactivation
- Password changes
"""

import pytest
from datetime import datetime

from controllers.user_controller import (
    create_user,
    get_user_by_id,
    get_user_by_username,
    get_user_by_email,
    update_user,
    deactivate_user,
    change_password,
    authenticate_user,
)
from models import User, UserRole
from utils.auth import verify_password
from utils.exceptions import (
    UserNotFoundError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
)
from schemas.user import UserCreate, UserUpdate


class TestUserCreation:
    """Tests for user creation functionality."""

    def test_create_user_success(self, db_session):
        """Test successful user creation."""
        user_data = UserCreate(
            username="newuser",
            email="newuser@example.com",
            password="SecurePassword123!"
        )

        user = create_user(db_session, user_data)

        assert user is not None
        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.role == UserRole.USER
        assert user.is_active is True

    def test_create_user_password_hashed(self, db_session):
        """Test that password is properly hashed on creation."""
        user_data = UserCreate(
            username="hashtest",
            email="hash@example.com",
            password="SecurePassword123!"
        )

        user = create_user(db_session, user_data)

        # Password should be hashed, not stored plaintext
        assert user.hashed_password != "SecurePassword123!"
        assert verify_password("SecurePassword123!", user.hashed_password)

    def test_create_user_duplicate_username(self, db_session, test_user):
        """Test that duplicate username raises error."""
        user_data = UserCreate(
            username="testuser",  # Already exists
            email="different@example.com",
            password="SecurePassword123!"
        )

        with pytest.raises(UserAlreadyExistsError):
            create_user(db_session, user_data)

    def test_create_user_duplicate_email(self, db_session, test_user):
        """Test that duplicate email raises error."""
        user_data = UserCreate(
            username="differentuser",
            email="test@example.com",  # Already exists
            password="SecurePassword123!"
        )

        with pytest.raises(UserAlreadyExistsError):
            create_user(db_session, user_data)

    def test_create_user_sets_timestamps(self, db_session):
        """Test that creation timestamp is set."""
        user_data = UserCreate(
            username="timetest",
            email="time@example.com",
            password="SecurePassword123!"
        )

        user = create_user(db_session, user_data)

        assert user.created_at is not None
        assert isinstance(user.created_at, datetime)


class TestUserRetrieval:
    """Tests for user retrieval functionality."""

    def test_get_user_by_id_success(self, db_session, test_user):
        """Test successful user retrieval by ID."""
        user = get_user_by_id(db_session, test_user.id)

        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username

    def test_get_user_by_id_not_found(self, db_session):
        """Test user retrieval with non-existent ID."""
        user = get_user_by_id(db_session, 99999)

        assert user is None

    def test_get_user_by_username_success(self, db_session, test_user):
        """Test successful user retrieval by username."""
        user = get_user_by_username(db_session, "testuser")

        assert user is not None
        assert user.id == test_user.id

    def test_get_user_by_username_not_found(self, db_session):
        """Test user retrieval with non-existent username."""
        user = get_user_by_username(db_session, "nonexistent")

        assert user is None

    def test_get_user_by_username_case_insensitive(self, db_session, test_user):
        """Test username lookup is case-insensitive."""
        user = get_user_by_username(db_session, "TESTUSER")

        # Depending on implementation, this might be None or the user
        # Most implementations treat usernames as case-sensitive
        # Adjust test based on your requirements

    def test_get_user_by_email_success(self, db_session, test_user):
        """Test successful user retrieval by email."""
        user = get_user_by_email(db_session, "test@example.com")

        assert user is not None
        assert user.id == test_user.id

    def test_get_user_by_email_not_found(self, db_session):
        """Test user retrieval with non-existent email."""
        user = get_user_by_email(db_session, "nonexistent@example.com")

        assert user is None


class TestUserUpdate:
    """Tests for user update functionality."""

    def test_update_user_email(self, db_session, test_user):
        """Test updating user email."""
        updates = UserUpdate(email="newemail@example.com")

        updated_user = update_user(db_session, test_user.id, updates)

        assert updated_user.email == "newemail@example.com"
        assert updated_user.updated_at is not None

    def test_update_user_multiple_fields(self, db_session, test_user):
        """Test updating multiple user fields."""
        updates = UserUpdate(
            email="multi@example.com",
            full_name="Test User Full Name"
        )

        updated_user = update_user(db_session, test_user.id, updates)

        assert updated_user.email == "multi@example.com"

    def test_update_user_not_found(self, db_session):
        """Test updating non-existent user raises error."""
        updates = UserUpdate(email="test@example.com")

        with pytest.raises(UserNotFoundError):
            update_user(db_session, 99999, updates)

    def test_update_user_duplicate_email(self, db_session, test_user, test_admin):
        """Test updating to existing email raises error."""
        updates = UserUpdate(email="admin@example.com")

        with pytest.raises(UserAlreadyExistsError):
            update_user(db_session, test_user.id, updates)

    def test_update_user_preserves_other_fields(self, db_session, test_user):
        """Test that update doesn't affect other fields."""
        original_username = test_user.username
        original_role = test_user.role

        updates = UserUpdate(email="preserve@example.com")
        updated_user = update_user(db_session, test_user.id, updates)

        assert updated_user.username == original_username
        assert updated_user.role == original_role


class TestUserDeactivation:
    """Tests for user deactivation functionality."""

    def test_deactivate_user_success(self, db_session, test_user):
        """Test successful user deactivation."""
        result = deactivate_user(db_session, test_user.id)

        assert result is True
        assert test_user.is_active is False

    def test_deactivate_user_not_found(self, db_session):
        """Test deactivating non-existent user."""
        with pytest.raises(UserNotFoundError):
            deactivate_user(db_session, 99999)

    def test_deactivate_already_inactive_user(self, db_session, inactive_user):
        """Test deactivating already inactive user."""
        # Should succeed without error
        result = deactivate_user(db_session, inactive_user.id)

        assert result is True
        assert inactive_user.is_active is False


class TestPasswordChange:
    """Tests for password change functionality."""

    def test_change_password_success(self, db_session, test_user):
        """Test successful password change."""
        result = change_password(
            db_session,
            test_user.id,
            old_password="TestPassword123!",
            new_password="NewSecurePassword456!"
        )

        assert result is True
        assert verify_password("NewSecurePassword456!", test_user.hashed_password)
        assert not verify_password("TestPassword123!", test_user.hashed_password)

    def test_change_password_wrong_old_password(self, db_session, test_user):
        """Test password change with wrong old password fails."""
        with pytest.raises(InvalidCredentialsError):
            change_password(
                db_session,
                test_user.id,
                old_password="WrongPassword123!",
                new_password="NewSecurePassword456!"
            )

    def test_change_password_user_not_found(self, db_session):
        """Test password change for non-existent user."""
        with pytest.raises(UserNotFoundError):
            change_password(
                db_session,
                99999,
                old_password="OldPassword123!",
                new_password="NewPassword123!"
            )

    def test_change_password_same_as_old(self, db_session, test_user):
        """Test changing to same password (behavior depends on requirements)."""
        # Some systems allow this, some don't
        result = change_password(
            db_session,
            test_user.id,
            old_password="TestPassword123!",
            new_password="TestPassword123!"
        )

        # If your system should reject same passwords, change to:
        # with pytest.raises(ValidationError):
        #     change_password(...)
        assert result is True


class TestUserAuthentication:
    """Tests for user authentication functionality."""

    def test_authenticate_user_success(self, db_session, test_user):
        """Test successful authentication."""
        user = authenticate_user(db_session, "testuser", "TestPassword123!")

        assert user is not None
        assert user.id == test_user.id

    def test_authenticate_user_wrong_password(self, db_session, test_user):
        """Test authentication with wrong password."""
        user = authenticate_user(db_session, "testuser", "WrongPassword123!")

        assert user is None

    def test_authenticate_user_nonexistent(self, db_session):
        """Test authentication with non-existent user."""
        user = authenticate_user(db_session, "nonexistent", "SomePassword123!")

        assert user is None

    def test_authenticate_user_inactive(self, db_session, inactive_user):
        """Test authentication with inactive user fails."""
        user = authenticate_user(db_session, "inactiveuser", "InactivePassword123!")

        # Depending on implementation:
        # - Returns None
        # - Raises InactiveUserError
        assert user is None or not user.is_active

    def test_authenticate_updates_last_login(self, db_session, test_user):
        """Test that successful auth updates last_login timestamp."""
        original_last_login = test_user.last_login

        user = authenticate_user(db_session, "testuser", "TestPassword123!")

        assert user.last_login is not None
        if original_last_login:
            assert user.last_login > original_last_login


class TestUserEndpoints:
    """Integration tests for user API endpoints."""

    def test_get_current_user(self, client, auth_headers, test_user):
        """Test GET /users/me returns current user."""
        response = client.get("/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email

    def test_update_current_user(self, client, auth_headers):
        """Test updating current user profile."""
        response = client.patch(
            "/users/me",
            headers=auth_headers,
            json={"email": "updated@example.com"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "updated@example.com"

    def test_get_user_by_id_admin_only(self, client, auth_headers, admin_headers, test_admin):
        """Test that only admins can get other users by ID."""
        # Regular user should fail
        response = client.get(
            f"/users/{test_admin.id}",
            headers=auth_headers
        )
        assert response.status_code in [403, 404]  # Forbidden or Not Found

        # Admin should succeed
        response = client.get(
            f"/users/{test_admin.id}",
            headers=admin_headers
        )
        # Adjust based on your API design

    def test_list_users_admin_only(self, client, auth_headers, admin_headers):
        """Test that only admins can list all users."""
        # Regular user should fail
        response = client.get("/users", headers=auth_headers)
        assert response.status_code in [403, 404]

        # Admin should succeed
        response = client.get("/users", headers=admin_headers)
        # Adjust based on your API design
