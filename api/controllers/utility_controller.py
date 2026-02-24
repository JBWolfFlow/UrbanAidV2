"""
Utility Controller for Business Logic

This controller provides:
- Geo-based search using Haversine formula
- Full-text search with location filtering
- CRUD operations with ownership verification
- Reporting and verification workflows
- Statistics aggregation
"""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from models.utility import Utility, UtilityReport
from schemas.utility import UtilityCreate, UtilityUpdate, UtilityFilter
from utils.exceptions import (
    UtilityNotFoundError,
    UnauthorizedError,
    InvalidLocationError,
    InvalidRadiusError,
)


# Earth's radius in kilometers
EARTH_RADIUS_KM = 6371.0

# Valid utility categories — unified set covering community-submitted
# and government-sourced (HRSA, VA, USDA) utilities for Washington state
VALID_CATEGORIES = {
    # Infrastructure
    "water_fountain",
    "restroom",
    "bench",
    "wifi",
    "charging",
    "transit",
    "library",
    # Essential Services
    "shelter",
    "free_food",
    "clinic",
    "medical",
    "food",
    # Government Health (HRSA)
    "health_center",
    "community_health_center",
    # Veterans (VA)
    "va_facility",
    "va_medical_center",
    "va_outpatient_clinic",
    "va_vet_center",
    # USDA
    "usda_snap_office",
    "usda_wic_office",
    "usda_farm_service_center",
    # Personal Care
    "shower",
    "laundry",
    "haircut",
    # Support Services
    "legal",
    "social_services",
    "job_training",
    "mental_health",
    "addiction_services",
    "suicide_prevention",
    "domestic_violence",
    # Emergency
    "warming_center",
    "cooling_center",
    "disaster_relief",
    # Specialized
    "needle_exchange",
    "pet_services",
    "dental",
    "eye_care",
    "tax_help",
    # Catch-all
    "other",
}


class UtilityController:
    """Controller for utility-related operations"""

    # =========================================================================
    # Haversine Distance Calculation
    # =========================================================================

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great-circle distance between two points on Earth.

        Uses the Haversine formula for accurate distance calculation.

        Args:
            lat1, lon1: Coordinates of first point (degrees)
            lat2, lon2: Coordinates of second point (degrees)

        Returns:
            Distance in kilometers
        """
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

        return EARTH_RADIUS_KM * c

    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> None:
        """Validate that coordinates are within valid ranges."""
        if not (-90 <= latitude <= 90):
            raise InvalidLocationError("Latitude must be between -90 and 90")
        if not (-180 <= longitude <= 180):
            raise InvalidLocationError("Longitude must be between -180 and 180")

    @staticmethod
    def validate_radius(radius: float) -> None:
        """Validate search radius is within allowed range."""
        if not (0.1 <= radius <= 50):
            raise InvalidRadiusError(
                "Search radius must be between 0.1 and 50 kilometers"
            )

    # =========================================================================
    # Geo-based Search
    # =========================================================================

    async def get_nearby_utilities(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        filters: Optional[UtilityFilter] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Find utilities within a specified radius of a location.

        Uses a bounding box pre-filter for performance, then calculates
        exact Haversine distances.

        Args:
            db: Database session
            latitude: Center point latitude
            longitude: Center point longitude
            radius_km: Search radius in kilometers
            filters: Optional category/accessibility filters
            limit: Maximum results to return
            offset: Pagination offset

        Returns:
            List of utilities with distance_km field
        """
        self.validate_coordinates(latitude, longitude)
        self.validate_radius(radius_km)

        # Calculate bounding box for efficient pre-filtering
        # Approximate degrees per km at this latitude
        lat_delta = radius_km / 111.0  # ~111 km per degree latitude
        lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))

        min_lat = latitude - lat_delta
        max_lat = latitude + lat_delta
        min_lon = longitude - lon_delta
        max_lon = longitude + lon_delta

        # Build query with bounding box filter
        query = db.query(Utility).filter(
            Utility.is_active == True,
            Utility.latitude >= min_lat,
            Utility.latitude <= max_lat,
            Utility.longitude >= min_lon,
            Utility.longitude <= max_lon,
        )

        # Apply additional filters
        if filters:
            if filters.category:
                query = query.filter(Utility.category == filters.category)
            if filters.wheelchair_accessible is not None:
                query = query.filter(
                    Utility.wheelchair_accessible == filters.wheelchair_accessible
                )
            if filters.verified is not None:
                query = query.filter(Utility.verified == filters.verified)

        # Get results and calculate exact distances
        utilities = query.all()

        results = []
        for utility in utilities:
            distance = self.haversine_distance(
                latitude, longitude, utility.latitude, utility.longitude
            )

            # Only include if within actual radius (bounding box is approximate)
            if distance <= radius_km:
                results.append(
                    {
                        "id": utility.id,
                        "name": utility.name,
                        "category": utility.category,
                        "subcategory": utility.subcategory,
                        "latitude": utility.latitude,
                        "longitude": utility.longitude,
                        "description": utility.description,
                        "address": utility.address,
                        "external_id": utility.external_id,
                        "verified": utility.verified,
                        "wheelchair_accessible": utility.wheelchair_accessible,
                        "average_rating": utility.average_rating,
                        "rating_count": utility.rating_count,
                        "distance_km": round(distance, 2),
                    }
                )

        # Sort by distance and apply pagination
        results.sort(key=lambda x: x["distance_km"])
        return results[offset : offset + limit]

    async def search_utilities(
        self,
        db: Session,
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: float = 10.0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search utilities by text query with optional location filtering.

        Searches name and description fields for matching text.

        Args:
            db: Database session
            query: Search text
            latitude: Optional center latitude for geo filtering
            longitude: Optional center longitude for geo filtering
            radius_km: Search radius when location provided
            limit: Maximum results

        Returns:
            List of matching utilities with distance if location provided
        """
        search_pattern = f"%{query}%"

        db_query = db.query(Utility).filter(
            Utility.is_active == True,
            or_(
                Utility.name.ilike(search_pattern),
                Utility.description.ilike(search_pattern),
                Utility.category.ilike(search_pattern),
                Utility.address.ilike(search_pattern),
            ),
        )

        utilities = db_query.limit(limit * 2).all()  # Get extra for distance filtering

        results = []
        for utility in utilities:
            result = {
                "id": utility.id,
                "name": utility.name,
                "category": utility.category,
                "subcategory": utility.subcategory,
                "latitude": utility.latitude,
                "longitude": utility.longitude,
                "description": utility.description,
                "address": utility.address,
                "external_id": utility.external_id,
                "verified": utility.verified,
                "wheelchair_accessible": utility.wheelchair_accessible,
                "average_rating": utility.average_rating,
            }

            # Add distance if location provided
            if latitude is not None and longitude is not None:
                distance = self.haversine_distance(
                    latitude, longitude, utility.latitude, utility.longitude
                )
                if distance <= radius_km:
                    result["distance_km"] = round(distance, 2)
                    results.append(result)
            else:
                results.append(result)

        # Sort by distance if available
        if latitude is not None and longitude is not None:
            results.sort(key=lambda x: x.get("distance_km", float("inf")))

        return results[:limit]

    # =========================================================================
    # CRUD Operations
    # =========================================================================

    def get_utility_by_id(self, db: Session, utility_id: str) -> Optional[Utility]:
        """Get a utility by its ID."""
        return db.query(Utility).filter(Utility.id == utility_id).first()

    async def create_utility(
        self, db: Session, utility_data: UtilityCreate, user_id: Optional[int] = None
    ) -> Utility:
        """
        Create a new utility.

        Args:
            db: Database session
            utility_data: Utility creation data
            user_id: Optional creator's user ID

        Returns:
            Created Utility object
        """
        self.validate_coordinates(utility_data.latitude, utility_data.longitude)

        utility = Utility(
            id=str(uuid.uuid4()),
            name=utility_data.name,
            category=utility_data.category,
            subcategory=utility_data.subcategory,
            latitude=utility_data.latitude,
            longitude=utility_data.longitude,
            description=utility_data.description,
            wheelchair_accessible=utility_data.wheelchair_accessible or False,
            creator_id=user_id,
            verified=False,
            is_active=True,
        )

        db.add(utility)
        db.commit()
        db.refresh(utility)

        return utility

    async def update_utility(
        self,
        db: Session,
        utility_id: str,
        utility_data: UtilityUpdate,
        user_id: int,
        is_admin: bool = False,
    ) -> Optional[Utility]:
        """
        Update a utility.

        Only the creator, moderators, or admins can update.

        Args:
            db: Database session
            utility_id: Utility ID to update
            utility_data: Update data
            user_id: ID of user making the update
            is_admin: Whether user has admin/moderator role

        Returns:
            Updated Utility object

        Raises:
            UtilityNotFoundError: If utility doesn't exist
            UnauthorizedError: If user can't modify this utility
        """
        utility = self.get_utility_by_id(db, utility_id)
        if not utility:
            raise UtilityNotFoundError()

        # Check ownership or admin status
        if not is_admin and utility.creator_id != user_id:
            raise UnauthorizedError("You can only edit utilities you created")

        # Apply updates
        if utility_data.name is not None:
            utility.name = utility_data.name
        if utility_data.description is not None:
            utility.description = utility_data.description
        if utility_data.wheelchair_accessible is not None:
            utility.wheelchair_accessible = utility_data.wheelchair_accessible

        db.commit()
        db.refresh(utility)

        return utility

    async def delete_utility(
        self, db: Session, utility_id: str, user_id: int, is_admin: bool = False
    ) -> bool:
        """
        Soft-delete a utility (mark as inactive).

        Only the creator or admins can delete.

        Args:
            db: Database session
            utility_id: Utility ID to delete
            user_id: ID of user making the deletion
            is_admin: Whether user has admin role

        Returns:
            True if successful

        Raises:
            UtilityNotFoundError: If utility doesn't exist
            UnauthorizedError: If user can't delete this utility
        """
        utility = self.get_utility_by_id(db, utility_id)
        if not utility:
            raise UtilityNotFoundError()

        # Only creator or admin can delete
        if not is_admin and utility.creator_id != user_id:
            raise UnauthorizedError("You can only delete utilities you created")

        # Soft delete
        utility.is_active = False
        db.commit()

        return True

    # =========================================================================
    # Reporting and Verification
    # =========================================================================

    async def report_utility(
        self,
        db: Session,
        utility_id: str,
        reason: str,
        description: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> UtilityReport:
        """
        Report a utility for review.

        Args:
            db: Database session
            utility_id: Utility to report
            reason: Report reason ('incorrect', 'closed', 'safety', 'spam', 'other')
            description: Optional detailed description
            user_id: Optional reporter's user ID

        Returns:
            Created UtilityReport object

        Raises:
            UtilityNotFoundError: If utility doesn't exist
        """
        utility = self.get_utility_by_id(db, utility_id)
        if not utility:
            raise UtilityNotFoundError()

        report = UtilityReport(
            utility_id=utility_id,
            reporter_id=user_id,
            reason=reason,
            description=description,
            status="pending",
        )

        # Increment report count on utility
        utility.report_count += 1

        db.add(report)
        db.commit()
        db.refresh(report)

        return report

    async def verify_utility(
        self, db: Session, utility_id: str, admin_user_id: int
    ) -> Utility:
        """
        Mark a utility as verified (admin/moderator only).

        Args:
            db: Database session
            utility_id: Utility to verify
            admin_user_id: ID of admin/moderator

        Returns:
            Updated Utility object

        Raises:
            UtilityNotFoundError: If utility doesn't exist
        """
        utility = self.get_utility_by_id(db, utility_id)
        if not utility:
            raise UtilityNotFoundError()

        utility.verified = True
        utility.verified_by_id = admin_user_id
        utility.verified_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(utility)

        return utility

    # =========================================================================
    # Statistics
    # =========================================================================

    async def get_app_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Get aggregate statistics for the application.

        Returns:
            Dictionary with counts by category, verification status, etc.
        """
        total_utilities = db.query(Utility).filter(Utility.is_active == True).count()
        verified_utilities = (
            db.query(Utility)
            .filter(Utility.is_active == True, Utility.verified == True)
            .count()
        )

        # Count by category
        category_counts = (
            db.query(Utility.category, func.count(Utility.id).label("count"))
            .filter(Utility.is_active == True)
            .group_by(Utility.category)
            .all()
        )

        # Pending reports
        pending_reports = (
            db.query(UtilityReport).filter(UtilityReport.status == "pending").count()
        )

        return {
            "total_utilities": total_utilities,
            "verified_utilities": verified_utilities,
            "verification_rate": round(
                verified_utilities / max(total_utilities, 1) * 100, 1
            ),
            "categories": {cat: count for cat, count in category_counts},
            "pending_reports": pending_reports,
        }

    async def increment_view_count(self, db: Session, utility_id: str) -> None:
        """Increment view count for a utility."""
        utility = self.get_utility_by_id(db, utility_id)
        if utility:
            utility.view_count += 1
            db.commit()

    async def update_rating_stats(
        self, db: Session, utility_id: str, new_average: float, new_count: int
    ) -> None:
        """Update denormalized rating statistics."""
        utility = self.get_utility_by_id(db, utility_id)
        if utility:
            utility.average_rating = new_average
            utility.rating_count = new_count
            db.commit()


# Singleton instance for dependency injection
utility_controller = UtilityController()
