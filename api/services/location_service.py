"""
Location Service for Geographic Operations

Provides:
- Haversine distance calculations
- Bounding box generation for efficient geo queries
- Coordinate validation
- Address geocoding (using external services)
- Reverse geocoding
"""

import math
import os
from typing import Tuple, List, Dict, Any, Optional
from dataclasses import dataclass
import httpx
import logging

logger = logging.getLogger(__name__)

# Earth's radius in different units
EARTH_RADIUS_KM = 6371.0
EARTH_RADIUS_MI = 3958.8


@dataclass
class Coordinates:
    """Represents geographic coordinates."""

    latitude: float
    longitude: float

    def __post_init__(self):
        """Validate coordinates on creation."""
        if not (-90 <= self.latitude <= 90):
            raise ValueError(
                f"Latitude must be between -90 and 90, got {self.latitude}"
            )
        if not (-180 <= self.longitude <= 180):
            raise ValueError(
                f"Longitude must be between -180 and 180, got {self.longitude}"
            )

    def to_tuple(self) -> Tuple[float, float]:
        """Return coordinates as (lat, lng) tuple."""
        return (self.latitude, self.longitude)

    def to_dict(self) -> Dict[str, float]:
        """Return coordinates as dictionary."""
        return {"latitude": self.latitude, "longitude": self.longitude}


@dataclass
class BoundingBox:
    """Represents a geographic bounding box for efficient queries."""

    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float

    def contains(self, lat: float, lng: float) -> bool:
        """Check if a point is within the bounding box."""
        return (
            self.min_lat <= lat <= self.max_lat and self.min_lng <= lng <= self.max_lng
        )

    def to_dict(self) -> Dict[str, float]:
        """Return bounding box as dictionary."""
        return {
            "min_lat": self.min_lat,
            "max_lat": self.max_lat,
            "min_lng": self.min_lng,
            "max_lng": self.max_lng,
        }


class LocationService:
    """
    Service for location-related operations.

    Provides accurate distance calculations using the Haversine formula,
    bounding box generation for efficient database queries, and
    optional geocoding services.
    """

    def __init__(self):
        """Initialize the location service."""
        self.google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self._geocoding_enabled = bool(self.google_api_key)
        self._session: Optional[httpx.AsyncClient] = None

    # =========================================================================
    # Distance Calculations
    # =========================================================================

    @staticmethod
    def haversine_distance(
        lat1: float, lon1: float, lat2: float, lon2: float, unit: str = "km"
    ) -> float:
        """
        Calculate the great-circle distance between two points on Earth.

        Uses the Haversine formula for accurate distance calculation on a sphere.

        Args:
            lat1: Latitude of first point in degrees
            lon1: Longitude of first point in degrees
            lat2: Latitude of second point in degrees
            lon2: Longitude of second point in degrees
            unit: Distance unit - "km" (kilometers) or "mi" (miles)

        Returns:
            Distance between the two points in the specified unit.

        Raises:
            ValueError: If coordinates are invalid or unit is not recognized.
        """
        # Validate coordinates
        for lat in [lat1, lat2]:
            if not (-90 <= lat <= 90):
                raise ValueError(f"Latitude must be between -90 and 90, got {lat}")
        for lon in [lon1, lon2]:
            if not (-180 <= lon <= 180):
                raise ValueError(f"Longitude must be between -180 and 180, got {lon}")

        # Select Earth radius based on unit
        if unit == "km":
            radius = EARTH_RADIUS_KM
        elif unit == "mi":
            radius = EARTH_RADIUS_MI
        else:
            raise ValueError(f"Unknown unit: {unit}. Use 'km' or 'mi'.")

        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        # Haversine formula
        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = radius * c
        return round(distance, 4)

    def calculate_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float, unit: str = "km"
    ) -> float:
        """
        Calculate distance between two coordinates.

        Instance method wrapper for haversine_distance.

        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            unit: Distance unit ("km" or "mi")

        Returns:
            Distance in the specified unit.
        """
        return self.haversine_distance(lat1, lon1, lat2, lon2, unit)

    # =========================================================================
    # Bounding Box Generation
    # =========================================================================

    @staticmethod
    def get_bounding_box(lat: float, lng: float, radius_km: float) -> BoundingBox:
        """
        Generate a bounding box around a point for efficient database queries.

        The bounding box is a rectangular approximation of a circular area.
        It's used as a pre-filter before applying exact distance calculations.

        Args:
            lat: Center latitude in degrees
            lng: Center longitude in degrees
            radius_km: Radius in kilometers

        Returns:
            BoundingBox with min/max latitude and longitude.

        Note:
            The bounding box may include points outside the actual radius
            (at corners), but will never exclude points within the radius.
            Always verify distances for points within the bounding box.
        """
        # Validate inputs
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude must be between -90 and 90, got {lat}")
        if not (-180 <= lng <= 180):
            raise ValueError(f"Longitude must be between -180 and 180, got {lng}")
        if radius_km <= 0:
            raise ValueError(f"Radius must be positive, got {radius_km}")

        # Calculate latitude change (consistent everywhere on Earth)
        # 1 degree of latitude ≈ 111.32 km
        lat_change = radius_km / 111.32

        # Calculate longitude change (varies with latitude)
        # 1 degree of longitude = 111.32 km * cos(latitude)
        lat_rad = math.radians(lat)
        lng_change = radius_km / (111.32 * max(math.cos(lat_rad), 0.001))

        return BoundingBox(
            min_lat=max(lat - lat_change, -90),
            max_lat=min(lat + lat_change, 90),
            min_lng=max(lng - lng_change, -180),
            max_lng=min(lng + lng_change, 180),
        )

    def get_nearby_points(
        self, latitude: float, longitude: float, radius_km: float
    ) -> BoundingBox:
        """
        Get bounding box for finding nearby points within radius.

        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers

        Returns:
            BoundingBox for database query optimization.
        """
        return self.get_bounding_box(latitude, longitude, radius_km)

    # =========================================================================
    # Coordinate Validation
    # =========================================================================

    @staticmethod
    def validate_coordinates(lat: float, lng: float) -> bool:
        """
        Validate that coordinates are within valid ranges.

        Args:
            lat: Latitude to validate
            lng: Longitude to validate

        Returns:
            True if coordinates are valid.
        """
        return (-90 <= lat <= 90) and (-180 <= lng <= 180)

    @staticmethod
    def normalize_longitude(lng: float) -> float:
        """
        Normalize longitude to -180 to 180 range.

        Args:
            lng: Longitude that may be outside normal range

        Returns:
            Normalized longitude within -180 to 180.
        """
        while lng > 180:
            lng -= 360
        while lng < -180:
            lng += 360
        return lng

    # =========================================================================
    # Geocoding Services
    # =========================================================================

    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create async HTTP session."""
        if self._session is None:
            self._session = httpx.AsyncClient(timeout=30.0)
        return self._session

    async def close_session(self):
        """Close HTTP session."""
        if self._session:
            await self._session.aclose()
            self._session = None

    async def geocode_address(self, address: str) -> Optional[Coordinates]:
        """
        Convert an address string to coordinates.

        Requires GOOGLE_MAPS_API_KEY environment variable.

        Args:
            address: Street address or location description

        Returns:
            Coordinates if found, None otherwise.
        """
        if not self._geocoding_enabled:
            logger.warning("Geocoding disabled - GOOGLE_MAPS_API_KEY not configured")
            return None

        try:
            session = await self._get_session()
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"address": address, "key": self.google_api_key}

            response = await session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK" and data["results"]:
                location = data["results"][0]["geometry"]["location"]
                return Coordinates(latitude=location["lat"], longitude=location["lng"])

            logger.warning(f"Geocoding failed for '{address}': {data.get('status')}")
            return None

        except Exception as e:
            logger.error(f"Geocoding error for '{address}': {e}")
            return None

    async def reverse_geocode(self, lat: float, lng: float) -> Optional[Dict[str, str]]:
        """
        Convert coordinates to an address.

        Requires GOOGLE_MAPS_API_KEY environment variable.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            Address dictionary if found, None otherwise.
        """
        if not self._geocoding_enabled:
            logger.warning(
                "Reverse geocoding disabled - GOOGLE_MAPS_API_KEY not configured"
            )
            return None

        try:
            session = await self._get_session()
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"latlng": f"{lat},{lng}", "key": self.google_api_key}

            response = await session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                components = {
                    c["types"][0]: c["long_name"]
                    for c in result.get("address_components", [])
                    if c.get("types")
                }

                return {
                    "formatted_address": result.get("formatted_address", ""),
                    "street_number": components.get("street_number", ""),
                    "street": components.get("route", ""),
                    "city": components.get("locality", ""),
                    "state": components.get("administrative_area_level_1", ""),
                    "country": components.get("country", ""),
                    "zip_code": components.get("postal_code", ""),
                }

            logger.warning(
                f"Reverse geocoding failed for ({lat}, {lng}): {data.get('status')}"
            )
            return None

        except Exception as e:
            logger.error(f"Reverse geocoding error for ({lat}, {lng}): {e}")
            return None

    # =========================================================================
    # Utility Functions
    # =========================================================================

    def sort_by_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        points: List[Dict[str, Any]],
        lat_key: str = "latitude",
        lng_key: str = "longitude",
    ) -> List[Dict[str, Any]]:
        """
        Sort a list of points by distance from an origin.

        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            points: List of dictionaries containing coordinates
            lat_key: Key for latitude in point dictionaries
            lng_key: Key for longitude in point dictionaries

        Returns:
            Points sorted by distance (closest first), with distance_km added.
        """
        for point in points:
            if lat_key in point and lng_key in point:
                point["distance_km"] = self.haversine_distance(
                    origin_lat, origin_lng, point[lat_key], point[lng_key]
                )
            else:
                point["distance_km"] = float("inf")

        return sorted(points, key=lambda p: p.get("distance_km", float("inf")))

    def filter_by_radius(
        self,
        origin_lat: float,
        origin_lng: float,
        points: List[Dict[str, Any]],
        radius_km: float,
        lat_key: str = "latitude",
        lng_key: str = "longitude",
    ) -> List[Dict[str, Any]]:
        """
        Filter points to only those within a specified radius.

        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            points: List of dictionaries containing coordinates
            radius_km: Maximum distance in kilometers
            lat_key: Key for latitude in point dictionaries
            lng_key: Key for longitude in point dictionaries

        Returns:
            Points within the specified radius, with distance_km added.
        """
        filtered = []
        for point in points:
            if lat_key in point and lng_key in point:
                distance = self.haversine_distance(
                    origin_lat, origin_lng, point[lat_key], point[lng_key]
                )
                if distance <= radius_km:
                    point["distance_km"] = distance
                    filtered.append(point)

        return filtered

    @staticmethod
    def degrees_to_radians(degrees: float) -> float:
        """Convert degrees to radians."""
        return math.radians(degrees)

    @staticmethod
    def radians_to_degrees(radians: float) -> float:
        """Convert radians to degrees."""
        return math.degrees(radians)

    @staticmethod
    def km_to_miles(km: float) -> float:
        """Convert kilometers to miles."""
        return km * 0.621371

    @staticmethod
    def miles_to_km(miles: float) -> float:
        """Convert miles to kilometers."""
        return miles * 1.60934


# Singleton instance for dependency injection
location_service = LocationService()
