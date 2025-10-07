"""Authentication utilities"""

from typing import Optional
from models.user import User

def get_current_user() -> Optional[User]:
    """Get current authenticated user - mock implementation"""
    # Mock user for development
    return None

def create_access_token(data: dict) -> str:
    """Create access token - mock implementation"""
    return "mock_token"