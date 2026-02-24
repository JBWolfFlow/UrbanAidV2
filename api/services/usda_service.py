"""
USDA Facilities Data Integration Service
Fetches and processes data from United States Department of Agriculture
"""

import httpx
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class USDAService:
    """Service for integrating USDA facility data"""

    def __init__(self):
        self.base_url = "https://www.usda.gov"
        # USDA doesn't have a unified API, so we'll use mock data and web scraping endpoints
        self.endpoints = {
            "rural_development": "/api/rd/offices",
            "snap_offices": "/api/fns/snap-offices",
            "service_centers": "/api/fsa/service-centers",
        }
        self.session = None

    async def get_session(self) -> httpx.AsyncClient:
        """Get or create async HTTP session"""
        if self.session is None:
            self.session = httpx.AsyncClient(timeout=30.0)
        return self.session

    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.aclose()
            self.session = None

    async def search_nearby_usda_facilities(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 50.0,
        facility_types: List[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Find USDA facilities near a specific location

        Args:
            latitude: User's latitude
            longitude: User's longitude
            radius_km: Search radius in kilometers
            facility_types: Types of facilities to include ('rural_development', 'snap', 'fsa', 'extension')
            limit: Maximum number of results

        Returns:
            List of nearby USDA facilities
        """
        try:
            if facility_types is None:
                facility_types = ["rural_development", "snap", "fsa", "extension"]

            # USDA doesn't have a unified public API.
            # Data is seeded into the local DB via seed_wa.py.
            # This endpoint returns empty until seeded; no mock fallback.
            logger.info(
                "USDA nearby search called — data served from local DB via /utilities endpoint"
            )
            return []

        except Exception as e:
            logger.error(f"Error fetching USDA facilities: {e}")
            return []

    async def get_usda_facilities_by_state(
        self, state_code: str, facility_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get USDA facilities in a specific state

        Args:
            state_code: Two-letter state code
            facility_types: Types of facilities to include

        Returns:
            List of USDA facilities in the state
        """
        try:
            if facility_types is None:
                facility_types = ["rural_development", "snap", "fsa", "extension"]

            # Data is seeded into the local DB via seed_wa.py — no mock fallback
            logger.info(
                f"USDA state search for {state_code} — data served from local DB"
            )
            return []

        except Exception as e:
            logger.error(f"Error fetching USDA facilities for state {state_code}: {e}")
            return []

    def _transform_usda_data(
        self, usda_data: Dict[str, Any], facility_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Transform USDA facility data to UrbanAid format

        Args:
            usda_data: Raw data from USDA source
            facility_type: Type of USDA facility

        Returns:
            Transformed data dictionary or None if invalid
        """
        try:
            return {
                "id": f"usda_{facility_type}_{usda_data.get('id', '')}",
                "name": usda_data.get("name", "USDA Facility"),
                "category": "usda_facility",
                "subcategory": self._determine_usda_facility_subtype(
                    facility_type, usda_data
                ),
                "latitude": float(usda_data.get("latitude", 0)),
                "longitude": float(usda_data.get("longitude", 0)),
                "address": {
                    "street": usda_data.get("address", ""),
                    "city": usda_data.get("city", ""),
                    "state": usda_data.get("state", ""),
                    "zip_code": usda_data.get("zip_code", ""),
                    "county": usda_data.get("county", ""),
                },
                "contact": {
                    "phone": usda_data.get("phone", ""),
                    "website": usda_data.get("website", ""),
                    "email": usda_data.get("email", ""),
                },
                "services": self._extract_usda_services(facility_type, usda_data),
                "hours": self._extract_usda_hours(usda_data),
                "accessibility": {
                    "wheelchair_accessible": usda_data.get(
                        "wheelchair_accessible", True
                    ),
                    "public_transit": usda_data.get("public_transit", False),
                },
                "verification": {
                    "verified": True,  # USDA data is official
                    "source": "USDA",
                    "last_updated": usda_data.get("last_updated", ""),
                },
                "metadata": {
                    "facility_type": facility_type,
                    "agency": self._get_usda_agency(facility_type),
                    "programs": usda_data.get("programs", []),
                    "languages": usda_data.get("languages_supported", ["English"]),
                },
            }
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Error transforming USDA data: {e}")
            return None

    def _determine_usda_facility_subtype(
        self, facility_type: str, data: Dict[str, Any]
    ) -> str:
        """Determine the specific subtype of USDA facility"""
        if facility_type == "rural_development":
            return "usda_rural_development_office"
        elif facility_type == "snap":
            return "usda_snap_office"
        elif facility_type == "fsa":
            return "usda_farm_service_center"
        elif facility_type == "extension":
            return "usda_extension_office"
        elif facility_type == "wic":
            return "usda_wic_office"
        else:
            return "usda_facility"

    def _extract_usda_services(
        self, facility_type: str, data: Dict[str, Any]
    ) -> List[str]:
        """Extract available services based on facility type"""
        services = []

        if facility_type == "rural_development":
            services.extend(
                [
                    "Rural Housing Loans",
                    "Business & Industry Loans",
                    "Community Facilities Direct Loans",
                    "Water & Waste Disposal Loans",
                    "Rural Energy Programs",
                    "Broadband Access Programs",
                ]
            )
        elif facility_type == "snap":
            services.extend(
                [
                    "SNAP Application Assistance",
                    "Food Assistance Program Information",
                    "Nutrition Education",
                    "Benefits Card Replacement",
                    "Eligibility Screening",
                ]
            )
        elif facility_type == "fsa":
            services.extend(
                [
                    "Farm Loans",
                    "Conservation Programs",
                    "Crop Insurance",
                    "Disaster Assistance",
                    "Marketing Assistance Loans",
                    "Commodity Programs",
                ]
            )
        elif facility_type == "extension":
            services.extend(
                [
                    "Agricultural Education",
                    "4-H Youth Programs",
                    "Master Gardener Programs",
                    "Family & Consumer Sciences",
                    "Community Development",
                    "Nutrition Education",
                ]
            )
        elif facility_type == "wic":
            services.extend(
                [
                    "WIC Benefits",
                    "Nutrition Counseling",
                    "Breastfeeding Support",
                    "Health Screenings",
                    "Referrals to Healthcare",
                ]
            )

        return services

    def _extract_usda_hours(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Extract operating hours from USDA data"""
        return {
            "monday": data.get("hours_monday", "8:00 AM - 4:30 PM"),
            "tuesday": data.get("hours_tuesday", "8:00 AM - 4:30 PM"),
            "wednesday": data.get("hours_wednesday", "8:00 AM - 4:30 PM"),
            "thursday": data.get("hours_thursday", "8:00 AM - 4:30 PM"),
            "friday": data.get("hours_friday", "8:00 AM - 4:30 PM"),
            "saturday": data.get("hours_saturday", "Closed"),
            "sunday": data.get("hours_sunday", "Closed"),
            "notes": data.get("hours_notes", "Hours may vary, please call ahead"),
        }

    def _get_usda_agency(self, facility_type: str) -> str:
        """Get the USDA agency responsible for the facility type"""
        agency_mapping = {
            "rural_development": "Rural Development (RD)",
            "snap": "Food and Nutrition Service (FNS)",
            "fsa": "Farm Service Agency (FSA)",
            "extension": "National Institute of Food and Agriculture (NIFA)",
            "wic": "Food and Nutrition Service (FNS)",
        }
        return agency_mapping.get(facility_type, "USDA")

    async def get_usda_facility_details(
        self, facility_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific USDA facility

        Args:
            facility_id: USDA facility ID

        Returns:
            Detailed facility information or None if not found
        """
        try:
            # Extract facility type and ID from our prefixed ID
            parts = facility_id.split("_")
            if len(parts) >= 3 and parts[0] == "usda":
                facility_type = parts[1]

                # Mock detailed facility lookup
                # In production, this would call the appropriate USDA API
                return {
                    "id": facility_id,
                    "name": f"USDA {facility_type.title()} Facility",
                    "category": "usda_facility",
                    "subcategory": self._determine_usda_facility_subtype(
                        facility_type, {}
                    ),
                    "detailed_info": "Detailed facility information would be fetched from USDA APIs",
                }

            return None

        except Exception as e:
            logger.error(f"Error fetching USDA facility details for {facility_id}: {e}")
            return None
