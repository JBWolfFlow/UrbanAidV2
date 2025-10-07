"""Custom exception classes for UrbanAid API"""

class UtilityNotFoundError(Exception):
    """Raised when a utility is not found"""
    pass

class UnauthorizedError(Exception):
    """Raised when user is not authorized"""
    pass 