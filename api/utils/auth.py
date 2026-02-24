"""
Enterprise-grade Authentication Utilities for UrbanAid API

This module provides comprehensive JWT-based authentication including:
- Password hashing with bcrypt (adaptive cost factor)
- Access token generation and validation
- Refresh token management
- FastAPI dependency injection for protected routes
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# Security configuration from environment
_DEFAULT_SECRET = "your-256-bit-secret-key-change-in-production"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", _DEFAULT_SECRET)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Fail-fast: refuse to start in production with the default secret
if os.getenv("ENVIRONMENT") == "production" and JWT_SECRET_KEY == _DEFAULT_SECRET:
    raise RuntimeError(
        "FATAL: JWT_SECRET_KEY is set to the default placeholder. "
        'Generate a secure key: python -c "import secrets; print(secrets.token_urlsafe(64))"'
    )

# Password hashing context with bcrypt
# Using bcrypt with default rounds (12) - provides ~300ms hash time
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


class TokenData(BaseModel):
    """Token payload data structure"""

    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


# =============================================================================
# Password Hashing Functions
# =============================================================================


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Uses bcrypt's built-in timing-safe comparison to prevent timing attacks.

    Args:
        plain_password: The password to verify
        hashed_password: The bcrypt hash to verify against

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    The hash includes the salt and cost factor, making it self-contained.

    Args:
        password: The plain text password to hash

    Returns:
        The bcrypt hash string
    """
    return pwd_context.hash(password)


# =============================================================================
# Token Creation Functions
# =============================================================================


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Access tokens are short-lived (default 30 minutes) and contain
    user identification claims.

    Args:
        data: Dictionary containing claims to encode (should include user_id, username, role)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update(
        {"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"}
    )

    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token.

    Refresh tokens are long-lived (default 7 days) and are used to
    obtain new access tokens without re-authentication.

    Args:
        data: Dictionary containing claims to encode (should include user_id)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update(
        {"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"}
    )

    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT string to decode

    Returns:
        TokenData if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        role: str = payload.get("role", "user")
        exp = payload.get("exp")

        if user_id is None:
            return None

        return TokenData(
            user_id=user_id,
            username=username,
            role=role,
            exp=datetime.fromtimestamp(exp, tz=timezone.utc) if exp else None,
        )
    except JWTError:
        return None


# =============================================================================
# FastAPI Dependencies
# =============================================================================


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    FastAPI dependency to get the current authenticated user.

    This dependency extracts and validates the JWT from the Authorization header.
    Use this for routes that require authentication.

    Args:
        token: JWT extracted from Authorization header (injected by FastAPI)

    Returns:
        TokenData containing user information

    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception

    return token_data


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
) -> Optional[TokenData]:
    """
    FastAPI dependency to optionally get the current user.

    Use this for routes that work for both authenticated and anonymous users
    but may provide enhanced functionality for authenticated users.

    Args:
        token: Optional JWT from Authorization header

    Returns:
        TokenData if authenticated, None if anonymous
    """
    if token is None:
        return None

    return decode_token(token)


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    FastAPI dependency to get an active authenticated user.

    This adds an additional check that the user account is active.
    Use for routes that should only be accessible to active accounts.

    Note: In a full implementation, this would check the database
    to verify the user is still active.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        TokenData for active user

    Raises:
        HTTPException: 403 if user is inactive
    """
    # In production, you would check the database here
    # For now, we trust the token claims
    return current_user


def require_role(allowed_roles: list[str]):
    """
    Factory function to create role-checking dependencies.

    Use this to create dependencies that require specific roles.

    Example:
        @app.get("/admin/users")
        async def admin_route(user: TokenData = Depends(require_role(["admin"]))):
            ...

    Args:
        allowed_roles: List of role names that are allowed

    Returns:
        Dependency function that checks user role
    """

    async def role_checker(
        current_user: TokenData = Depends(get_current_user),
    ) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}",
            )
        return current_user

    return role_checker


# Convenience dependencies for common role requirements
require_admin = require_role(["admin"])
require_moderator = require_role(["admin", "moderator"])
