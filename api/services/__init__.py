"""
Services Package for UrbanAid API

This package contains service modules for external integrations and
business logic operations:

- LocationService: Geographic calculations (Haversine, bounding boxes, geocoding)
- NotificationService: Multi-channel notifications (email, push, SMS)
- HRSAService: HRSA Health Centers data integration
- VAService: VA Medical Centers data integration
- USDAService: USDA facilities data integration
"""

from .location_service import (
    LocationService,
    location_service,
    Coordinates,
    BoundingBox,
    EARTH_RADIUS_KM,
    EARTH_RADIUS_MI,
)

from .notification_service import (
    NotificationService,
    notification_service,
    NotificationChannel,
    NotificationPriority,
    NotificationStatus,
    NotificationResult,
    NotificationPayload,
)

from .hrsa_service import HRSAService
from .va_service import VAService
from .usda_service import USDAService


__all__ = [
    # Location Service
    "LocationService",
    "location_service",
    "Coordinates",
    "BoundingBox",
    "EARTH_RADIUS_KM",
    "EARTH_RADIUS_MI",
    # Notification Service
    "NotificationService",
    "notification_service",
    "NotificationChannel",
    "NotificationPriority",
    "NotificationStatus",
    "NotificationResult",
    "NotificationPayload",
    # External API Services
    "HRSAService",
    "VAService",
    "USDAService",
]
