"""
HRSA Health Centers Data Integration Service
Fetches and processes data from Health Resources & Services Administration
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)

class HRSAService:
    """Service for integrating HRSA health center data"""
    
    def __init__(self):
        self.base_url = "https://data.hrsa.gov"
        self.api_endpoints = {
            "health_centers": "/data/download/hrsa/Health_Center_Service_Delivery_and_Look-Alike_Sites_Data.xlsx",
            "fqhc_lookup": "/data/reports/datagrid?gridName=FQHCs"
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
    
    async def fetch_health_centers_by_state(self, state_code: str) -> List[Dict[str, Any]]:
        """
        Fetch health centers for a specific state
        
        Args:
            state_code: Two-letter state code (e.g., 'CA', 'NY')
            
        Returns:
            List of health center data dictionaries
        """
        try:
            session = await self.get_session()
            
            # HRSA provides state-specific data through their API
            url = f"{self.base_url}/api/HealthCenters/GetHealthCentersByState"
            params = {
                "state": state_code,
                "format": "json"
            }
            
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Transform HRSA data to UrbanAid format
            health_centers = []
            for center in data.get("data", []):
                transformed_center = self._transform_hrsa_data(center)
                if transformed_center:
                    health_centers.append(transformed_center)
            
            logger.info(f"Fetched {len(health_centers)} health centers for state {state_code}")
            return health_centers
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching HRSA data for state {state_code}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching HRSA data for state {state_code}: {e}")
            return []
    
    async def search_nearby_health_centers(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: float = 25.0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Find health centers near a specific location
        
        Args:
            latitude: User's latitude
            longitude: User's longitude
            radius_km: Search radius in kilometers
            limit: Maximum number of results
            
        Returns:
            List of nearby health centers
        """
        try:
            # For demo purposes, we'll use a mock dataset
            # In production, you'd want to cache HRSA data in your database
            # and query it efficiently with PostGIS spatial functions
            
            nearby_centers = await self._get_mock_health_centers(
                latitude, longitude, radius_km, limit
            )
            
            return nearby_centers
            
        except Exception as e:
            logger.error(f"Error searching nearby health centers: {e}")
            return []
    
    def _transform_hrsa_data(self, hrsa_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform HRSA health center data to UrbanAid format
        
        Args:
            hrsa_data: Raw data from HRSA API
            
        Returns:
            Transformed data dictionary or None if invalid
        """
        try:
            # Map HRSA fields to UrbanAid utility format
            return {
                "id": f"hrsa_{hrsa_data.get('site_id', '')}",
                "name": hrsa_data.get("site_name", "Health Center"),
                "category": "health_center",
                "subcategory": self._determine_health_center_type(hrsa_data),
                "latitude": float(hrsa_data.get("latitude", 0)),
                "longitude": float(hrsa_data.get("longitude", 0)),
                "address": {
                    "street": hrsa_data.get("site_address", ""),
                    "city": hrsa_data.get("site_city", ""),
                    "state": hrsa_data.get("site_state_name", ""),
                    "zip_code": hrsa_data.get("site_postal_code", ""),
                    "county": hrsa_data.get("county_name", "")
                },
                "contact": {
                    "phone": hrsa_data.get("site_phone", ""),
                    "website": hrsa_data.get("site_web_address", ""),
                    "email": hrsa_data.get("contact_email", "")
                },
                "services": self._extract_services(hrsa_data),
                "hours": self._extract_hours(hrsa_data),
                "accessibility": {
                    "wheelchair_accessible": hrsa_data.get("ada_accessible", False),
                    "public_transit": hrsa_data.get("public_transportation", False)
                },
                "verification": {
                    "verified": True,  # HRSA data is official
                    "source": "HRSA",
                    "last_updated": hrsa_data.get("last_updated_date", "")
                },
                "metadata": {
                    "fqhc_status": hrsa_data.get("health_center_type", ""),
                    "grantee_name": hrsa_data.get("grantee_name", ""),
                    "grant_number": hrsa_data.get("grant_number", ""),
                    "service_area": hrsa_data.get("service_area_name", "")
                }
            }
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Error transforming HRSA data: {e}")
            return None
    
    def _determine_health_center_type(self, hrsa_data: Dict[str, Any]) -> str:
        """Determine the specific type of health center"""
        center_type = hrsa_data.get("health_center_type", "").lower()
        
        if "community" in center_type:
            return "community_health_center"
        elif "migrant" in center_type:
            return "migrant_health_center"
        elif "homeless" in center_type:
            return "homeless_health_center"
        elif "housing" in center_type:
            return "public_housing_health_center"
        elif "school" in center_type:
            return "school_based_health_center"
        else:
            return "federally_qualified_health_center"
    
    def _extract_services(self, hrsa_data: Dict[str, Any]) -> List[str]:
        """Extract available services from HRSA data"""
        services = []
        
        # Map HRSA service indicators to readable services
        service_mapping = {
            "primary_care": "Primary Care",
            "dental_care": "Dental Care", 
            "mental_health": "Mental Health Services",
            "substance_abuse": "Substance Abuse Treatment",
            "pharmacy": "Pharmacy Services",
            "vision_care": "Vision Care",
            "case_management": "Case Management",
            "transportation": "Transportation Services",
            "health_education": "Health Education",
            "interpretation": "Translation Services"
        }
        
        for key, service_name in service_mapping.items():
            if hrsa_data.get(key, False):
                services.append(service_name)
        
        return services
    
    def _extract_hours(self, hrsa_data: Dict[str, Any]) -> Dict[str, str]:
        """Extract operating hours from HRSA data"""
        # HRSA data may not always include detailed hours
        # This would need to be implemented based on actual HRSA data structure
        return {
            "monday": hrsa_data.get("hours_monday", "8:00 AM - 5:00 PM"),
            "tuesday": hrsa_data.get("hours_tuesday", "8:00 AM - 5:00 PM"),
            "wednesday": hrsa_data.get("hours_wednesday", "8:00 AM - 5:00 PM"),
            "thursday": hrsa_data.get("hours_thursday", "8:00 AM - 5:00 PM"),
            "friday": hrsa_data.get("hours_friday", "8:00 AM - 5:00 PM"),
            "saturday": hrsa_data.get("hours_saturday", "Closed"),
            "sunday": hrsa_data.get("hours_sunday", "Closed"),
            "notes": hrsa_data.get("hours_notes", "Hours may vary, please call ahead")
        }
    
    async def _get_mock_health_centers(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: float,
        limit: int
    ) -> List[Dict[str, Any]]:
        """
        Mock health centers data for demonstration
        In production, this would query your database with cached HRSA data
        """
        mock_centers = [
            {
                "id": "hrsa_mock_1",
                "name": "Community Health Center of Excellence",
                "category": "health_center",
                "subcategory": "community_health_center",
                "latitude": latitude + 0.01,
                "longitude": longitude + 0.01,
                "address": {
                    "street": "123 Main Street",
                    "city": "Anytown",
                    "state": "CA",
                    "zip_code": "90210",
                    "county": "Los Angeles"
                },
                "contact": {
                    "phone": "(555) 123-4567",
                    "website": "https://example-health-center.org",
                    "email": "info@example-health-center.org"
                },
                "services": [
                    "Primary Care",
                    "Dental Care",
                    "Mental Health Services",
                    "Pharmacy Services"
                ],
                "hours": {
                    "monday": "8:00 AM - 6:00 PM",
                    "tuesday": "8:00 AM - 6:00 PM",
                    "wednesday": "8:00 AM - 6:00 PM",
                    "thursday": "8:00 AM - 6:00 PM",
                    "friday": "8:00 AM - 5:00 PM",
                    "saturday": "9:00 AM - 1:00 PM",
                    "sunday": "Closed",
                    "notes": "Extended hours available by appointment"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": True
                },
                "verification": {
                    "verified": True,
                    "source": "HRSA",
                    "last_updated": "2024-01-15"
                },
                "distance_km": 1.1
            },
            {
                "id": "hrsa_mock_2", 
                "name": "Migrant Health Services Center",
                "category": "health_center",
                "subcategory": "migrant_health_center",
                "latitude": latitude - 0.015,
                "longitude": longitude + 0.008,
                "address": {
                    "street": "456 Agricultural Way",
                    "city": "Farmville",
                    "state": "CA",
                    "zip_code": "93725",
                    "county": "Fresno"
                },
                "contact": {
                    "phone": "(555) 987-6543",
                    "website": "https://migrant-health-example.org",
                    "email": "services@migrant-health-example.org"
                },
                "services": [
                    "Primary Care",
                    "Translation Services",
                    "Case Management",
                    "Health Education"
                ],
                "hours": {
                    "monday": "7:00 AM - 7:00 PM",
                    "tuesday": "7:00 AM - 7:00 PM", 
                    "wednesday": "7:00 AM - 7:00 PM",
                    "thursday": "7:00 AM - 7:00 PM",
                    "friday": "7:00 AM - 7:00 PM",
                    "saturday": "8:00 AM - 4:00 PM",
                    "sunday": "Closed",
                    "notes": "Bilingual staff available"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": False
                },
                "verification": {
                    "verified": True,
                    "source": "HRSA",
                    "last_updated": "2024-01-10"
                },
                "distance_km": 1.7
            }
        ]
        
        # Filter by radius and sort by distance
        filtered_centers = []
        user_location = (latitude, longitude)
        
        for center in mock_centers:
            center_location = (center["latitude"], center["longitude"])
            distance = geodesic(user_location, center_location).kilometers
            
            if distance <= radius_km:
                center["distance_km"] = round(distance, 2)
                filtered_centers.append(center)
        
        # Sort by distance and limit results
        filtered_centers.sort(key=lambda x: x["distance_km"])
        return filtered_centers[:limit]
    
    async def get_health_center_details(self, center_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific health center
        
        Args:
            center_id: HRSA health center ID
            
        Returns:
            Detailed health center information or None if not found
        """
        try:
            session = await self.get_session()
            
            # Extract the actual HRSA ID from our prefixed ID
            hrsa_id = center_id.replace("hrsa_", "")
            
            url = f"{self.base_url}/api/HealthCenters/GetHealthCenterDetails"
            params = {"site_id": hrsa_id}
            
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data and "data" in data:
                return self._transform_hrsa_data(data["data"])
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching health center details for {center_id}: {e}")
            return None