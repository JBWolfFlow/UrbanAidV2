"""
Custom Exception Classes for UrbanAid API

This module defines a comprehensive hierarchy of exceptions for:
- Authentication and authorization errors
- Resource not found errors
- Validation errors
- Business logic errors

Each exception includes a status code and can be mapped to HTTP responses.
"""

from typing import Optional


class UrbanAidException(Exception):
    """Base exception for all UrbanAid errors"""
    status_code: int = 500
    detail: str = "An unexpected error occurred"

    def __init__(self, detail: Optional[str] = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


# =============================================================================
# Authentication Exceptions
# =============================================================================

class InvalidCredentialsError(UrbanAidException):
    """Raised when username/password combination is invalid"""
    status_code = 401
    detail = "Invalid username or password"


class TokenExpiredError(UrbanAidException):
    """Raised when JWT token has expired"""
    status_code = 401
    detail = "Token has expired"


class InvalidTokenError(UrbanAidException):
    """Raised when JWT token is malformed or invalid"""
    status_code = 401
    detail = "Invalid authentication token"


class RefreshTokenInvalidError(UrbanAidException):
    """Raised when refresh token is invalid or revoked"""
    status_code = 401
    detail = "Invalid or revoked refresh token"


class MissingAuthenticationError(UrbanAidException):
    """Raised when authentication is required but not provided"""
    status_code = 401
    detail = "Authentication required"


# =============================================================================
# Authorization Exceptions
# =============================================================================

class UnauthorizedError(UrbanAidException):
    """Raised when user is not authorized for the requested action"""
    status_code = 403
    detail = "You are not authorized to perform this action"


class InsufficientPermissionsError(UrbanAidException):
    """Raised when user lacks required role/permissions"""
    status_code = 403
    detail = "Insufficient permissions for this operation"


class InactiveUserError(UrbanAidException):
    """Raised when an inactive user attempts an action"""
    status_code = 403
    detail = "User account is inactive"


# =============================================================================
# User Exceptions
# =============================================================================

class UserNotFoundError(UrbanAidException):
    """Raised when a requested user does not exist"""
    status_code = 404
    detail = "User not found"


class UserAlreadyExistsError(UrbanAidException):
    """Raised when trying to create a user that already exists"""
    status_code = 409
    detail = "A user with this username or email already exists"


class EmailAlreadyExistsError(UrbanAidException):
    """Raised when trying to register with an existing email"""
    status_code = 409
    detail = "A user with this email already exists"


class UsernameAlreadyExistsError(UrbanAidException):
    """Raised when trying to register with an existing username"""
    status_code = 409
    detail = "A user with this username already exists"


class InvalidPasswordError(UrbanAidException):
    """Raised when password doesn't meet requirements"""
    status_code = 400
    detail = "Password does not meet security requirements"


class PasswordMismatchError(UrbanAidException):
    """Raised when password confirmation doesn't match"""
    status_code = 400
    detail = "Passwords do not match"


# =============================================================================
# Resource Exceptions
# =============================================================================

class UtilityNotFoundError(UrbanAidException):
    """Raised when a utility is not found"""
    status_code = 404
    detail = "Utility not found"


class RatingNotFoundError(UrbanAidException):
    """Raised when a rating is not found"""
    status_code = 404
    detail = "Rating not found"


class ReportNotFoundError(UrbanAidException):
    """Raised when a report is not found"""
    status_code = 404
    detail = "Report not found"


# =============================================================================
# Validation Exceptions
# =============================================================================

class ValidationError(UrbanAidException):
    """Raised when input validation fails"""
    status_code = 400
    detail = "Validation error"


class InvalidLocationError(ValidationError):
    """Raised when latitude/longitude values are invalid"""
    detail = "Invalid location coordinates"


class InvalidCategoryError(ValidationError):
    """Raised when utility category is invalid"""
    detail = "Invalid utility category"


class InvalidRadiusError(ValidationError):
    """Raised when search radius is out of allowed range"""
    detail = "Search radius must be between 0.1 and 50 kilometers"


# =============================================================================
# Rate Limiting Exceptions
# =============================================================================

class RateLimitExceededError(UrbanAidException):
    """Raised when rate limit is exceeded"""
    status_code = 429
    detail = "Too many requests. Please try again later."


# =============================================================================
# External Service Exceptions
# =============================================================================

class ExternalServiceError(UrbanAidException):
    """Raised when an external API fails"""
    status_code = 502
    detail = "External service temporarily unavailable"


class HRSAServiceError(ExternalServiceError):
    """Raised when HRSA API fails"""
    detail = "HRSA service temporarily unavailable"


class VAServiceError(ExternalServiceError):
    """Raised when VA API fails"""
    detail = "VA service temporarily unavailable"


class USDAServiceError(ExternalServiceError):
    """Raised when USDA API fails"""
    detail = "USDA service temporarily unavailable"


class GeocodingServiceError(ExternalServiceError):
    """Raised when geocoding service fails"""
    detail = "Geocoding service temporarily unavailable"
