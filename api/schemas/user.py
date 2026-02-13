"""
User Schemas for Authentication and User Management

This module provides Pydantic schemas for:
- User registration and login
- JWT token responses
- Password management
- User profile updates
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from models.user import UserRole


# =============================================================================
# Password Validation
# =============================================================================

def validate_password_strength(password: str) -> str:
    """
    Validate password meets security requirements.

    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (!@#$%^&*(),.?":{}|<>)
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
    return password


# =============================================================================
# Base Schemas
# =============================================================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Username (3-50 chars, alphanumeric with _ and -)"
    )
    email: EmailStr = Field(..., description="Valid email address")


# =============================================================================
# Request Schemas
# =============================================================================

class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8-128 chars, must meet complexity requirements)"
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return validate_password_strength(v)


class UserLogin(BaseModel):
    """
    Schema for user login - credentials passed in request body.

    This replaces query parameter authentication for security.
    """
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Account password")


class PasswordChange(BaseModel):
    """Schema for changing password (authenticated user)"""
    current_password: str = Field(..., description="Current password for verification")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password"
    )
    confirm_password: str = Field(..., description="Confirm new password")

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class PasswordReset(BaseModel):
    """Schema for password reset (via email token)"""
    token: str = Field(..., description="Password reset token from email")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password"
    )
    confirm_password: str = Field(..., description="Confirm new password")

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class PasswordResetRequest(BaseModel):
    """Schema for requesting a password reset email"""
    email: EmailStr = Field(..., description="Email address to send reset link")


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    email: Optional[EmailStr] = Field(None, description="New email address")
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="New username"
    )


class UserRoleUpdate(BaseModel):
    """Schema for admin to update user role"""
    role: UserRole = Field(..., description="New role for user")


class RefreshTokenRequest(BaseModel):
    """Schema for refreshing access token"""
    refresh_token: str = Field(..., description="Valid refresh token")


# =============================================================================
# Response Schemas
# =============================================================================

class UserResponse(UserBase):
    """Schema for user information response"""
    id: int
    role: str
    is_active: bool
    email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    """Public user information (for other users to see)"""
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token for obtaining new access tokens")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    expires_in: int = Field(..., description="Access token expiration time in seconds")


class TokenData(BaseModel):
    """Schema for decoded token data (internal use)"""
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


# =============================================================================
# List Response Schemas
# =============================================================================

class UserListResponse(BaseModel):
    """Schema for paginated user list"""
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
