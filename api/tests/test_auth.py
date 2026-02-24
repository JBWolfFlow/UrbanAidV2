"""
Authentication Tests

Tests for password hashing, JWT token creation/validation,
and authentication middleware.
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt

from utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
)


class TestPasswordHashing:
    """Tests for password hashing utilities."""

    def test_password_hashing_produces_hash(self):
        """Test that hashing produces a different string than the original."""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are long

    def test_password_verification_success(self):
        """Test that correct password verifies successfully."""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Test that incorrect password fails verification."""
        password = "SecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_same_password_different_hashes(self):
        """Test that hashing same password produces different hashes (salting)."""
        password = "SecurePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to random salt
        assert hash1 != hash2
        # But both should verify
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_empty_password_handling(self):
        """Test handling of empty password."""
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True
        assert verify_password("something", hashed) is False

    def test_unicode_password(self):
        """Test handling of unicode characters in password."""
        password = "Пароль123!@#$%"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_very_long_password(self):
        """Test handling of very long passwords."""
        # Note: bcrypt has a 72-byte limit
        password = "A" * 100
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True


class TestJWTTokenCreation:
    """Tests for JWT token creation."""

    def test_access_token_creation(self):
        """Test that access token is created successfully."""
        data = {"sub": "testuser", "user_id": 1}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50

    def test_access_token_contains_claims(self):
        """Test that token contains the expected claims."""
        data = {"sub": "testuser", "user_id": 1}
        token = create_access_token(data)

        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        assert payload["sub"] == "testuser"
        assert payload["user_id"] == 1
        assert "exp" in payload

    def test_access_token_expiration(self):
        """Test that token has correct expiration."""
        data = {"sub": "testuser", "user_id": 1}
        expires = timedelta(minutes=30)
        token = create_access_token(data, expires_delta=expires)

        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Expiration should be approximately 30 minutes from now
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + expires

        # Allow 5 second tolerance
        assert abs((exp_time - expected_exp).total_seconds()) < 5

    def test_refresh_token_creation(self):
        """Test that refresh token is created successfully."""
        data = {"sub": "testuser", "user_id": 1}
        token = create_refresh_token(data)

        assert token is not None
        assert isinstance(token, str)

    def test_refresh_token_longer_expiration(self):
        """Test that refresh token has longer expiration than access token."""
        data = {"sub": "testuser", "user_id": 1}

        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)

        access_payload = jwt.decode(
            access_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )
        refresh_payload = jwt.decode(
            refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )

        assert refresh_payload["exp"] > access_payload["exp"]


class TestJWTTokenValidation:
    """Tests for JWT token validation (decode_token)."""

    def test_valid_token_decodes_successfully(self):
        """Test that valid token decodes successfully."""
        data = {"sub": "testuser", "user_id": 1, "username": "testuser"}
        token = create_access_token(data)

        token_data = decode_token(token)

        assert token_data is not None
        assert token_data.user_id == 1
        assert token_data.username == "testuser"

    def test_expired_token_returns_none(self):
        """Test that expired token returns None."""
        data = {"sub": "testuser", "user_id": 1}
        token = create_access_token(data, expires_delta=timedelta(minutes=-1))

        result = decode_token(token)
        assert result is None

    def test_invalid_token_format_returns_none(self):
        """Test that malformed token returns None."""
        invalid_token = "not.a.valid.token"

        result = decode_token(invalid_token)
        assert result is None

    def test_tampered_token_returns_none(self):
        """Test that tampered token returns None."""
        data = {"sub": "testuser", "user_id": 1}
        token = create_access_token(data)

        # Tamper with the token
        tampered_token = token[:-5] + "XXXXX"

        result = decode_token(tampered_token)
        assert result is None

    def test_wrong_secret_returns_none(self):
        """Test that token signed with wrong secret returns None."""
        payload = {
            "sub": "testuser",
            "user_id": 1,
            "exp": datetime.utcnow() + timedelta(minutes=30),
        }
        wrong_token = jwt.encode(payload, "wrong-secret-key", algorithm=JWT_ALGORITHM)

        result = decode_token(wrong_token)
        assert result is None

    def test_missing_user_id_returns_none(self):
        """Test that token without 'user_id' claim returns None."""
        payload = {"sub": "testuser", "exp": datetime.utcnow() + timedelta(minutes=30)}
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

        result = decode_token(token)
        assert result is None


class TestGetCurrentUser:
    """Tests for get_current_user dependency."""

    @pytest.mark.asyncio
    async def test_get_current_user_success(self):
        """Test successful token data retrieval from valid token."""
        token = create_access_token(
            data={
                "sub": "testuser",
                "user_id": 1,
                "username": "testuser",
                "role": "user",
            }
        )

        token_data = await get_current_user(token=token)

        assert token_data is not None
        assert token_data.user_id == 1
        assert token_data.username == "testuser"

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self):
        """Test that invalid token raises HTTPException."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token="invalid-token")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_expired_token(self):
        """Test that expired token raises HTTPException."""
        from fastapi import HTTPException

        token = create_access_token(
            data={"sub": "testuser", "user_id": 1}, expires_delta=timedelta(minutes=-1)
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token=token)
        assert exc_info.value.status_code == 401


class TestAuthenticationFlow:
    """Integration tests for complete authentication flows."""

    def test_login_success(self, client, test_user):
        """Test successful login returns tokens."""
        response = client.post(
            "/auth/login", json={"username": "testuser", "password": "TestPassword123!"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password fails."""
        response = client.post(
            "/auth/login",
            json={"username": "testuser", "password": "WrongPassword123!"},
        )

        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails."""
        response = client.post(
            "/auth/login",
            json={"username": "nonexistent", "password": "SomePassword123!"},
        )

        assert response.status_code == 401

    def test_login_inactive_user(self, client, inactive_user):
        """Test login with inactive user fails."""
        response = client.post(
            "/auth/login",
            json={"username": "inactiveuser", "password": "InactivePassword123!"},
        )

        assert response.status_code in [401, 403]

    def test_protected_endpoint_with_valid_token(self, client, auth_headers):
        """Test accessing protected endpoint with valid token."""
        response = client.get("/auth/me", headers=auth_headers)

        assert response.status_code == 200

    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token fails."""
        response = client.get("/auth/me")

        assert response.status_code in [401, 403]

    def test_protected_endpoint_with_expired_token(self, client, expired_token_headers):
        """Test accessing protected endpoint with expired token fails."""
        response = client.get("/auth/me", headers=expired_token_headers)

        assert response.status_code == 401

    def test_refresh_token_flow(self, client, test_user):
        """Test token refresh flow."""
        # First login to get tokens
        login_response = client.post(
            "/auth/login", json={"username": "testuser", "password": "TestPassword123!"}
        )

        assert login_response.status_code == 200
        tokens = login_response.json()

        # Use refresh token to get new access token
        refresh_response = client.post(
            "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
        )

        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        assert "access_token" in new_tokens


class TestRegistration:
    """Tests for user registration."""

    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code in [200, 201]
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_duplicate_username(self, client, test_user):
        """Test registration with existing username fails."""
        response = client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "different@example.com",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code in [400, 409, 500]

    def test_register_duplicate_email(self, client, test_user):
        """Test registration with existing email fails."""
        response = client.post(
            "/auth/register",
            json={
                "username": "different",
                "email": "test@example.com",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code in [400, 409, 500]

    def test_register_weak_password(self, client):
        """Test registration with weak password fails."""
        response = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "weak",
            },
        )

        assert response.status_code == 422  # Validation error

    def test_register_invalid_email(self, client):
        """Test registration with invalid email fails."""
        response = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "not-an-email",
                "password": "SecurePassword123!",
            },
        )

        assert response.status_code == 422  # Validation error
