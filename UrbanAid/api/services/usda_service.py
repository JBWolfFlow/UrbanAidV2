"""
USDA Facilities Data Integration Service
Fetches and processes data from United States Department of Agriculture
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from geopy.distance import geodesic
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
            "service_centers": "/api/fsa/service-centers"
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
        limit: int = 20
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
                facility_types = ['rural_development', 'snap', 'fsa', 'extension']
            
            # Since USDA doesn't have a unified API, we'll use mock data for demonstration
            # In production, you'd implement web scraping or use various USDA department APIs
            usda_facilities = await self._get_mock_usda_facilities(
                latitude, longitude, radius_km, facility_types, limit
            )
            
            # Sort by distance
            user_location = (latitude, longitude)
            for facility in usda_facilities:
                if facility.get("latitude") and facility.get("longitude"):
                    facility_location = (facility["latitude"], facility["longitude"])
                    distance_km = geodesic(user_location, facility_location).kilometers
                    facility["distance_km"] = round(distance_km, 2)
            
            # Sort by distance and limit results
            usda_facilities.sort(key=lambda x: x.get("distance_km", float('inf')))
            
            logger.info(f"Fetched {len(usda_facilities)} USDA facilities")
            return usda_facilities[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching USDA facilities: {e}")
            return []
    
    async def get_usda_facilities_by_state(
        self, 
        state_code: str, 
        facility_types: List[str] = None
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
                facility_types = ['rural_development', 'snap', 'fsa', 'extension']
            
            # Mock implementation for demonstration
            all_facilities = await self._get_mock_state_facilities(state_code, facility_types)
            
            logger.info(f"Fetched {len(all_facilities)} USDA facilities for state {state_code}")
            return all_facilities
            
        except Exception as e:
            logger.error(f"Error fetching USDA facilities for state {state_code}: {e}")
            return []
    
    def _transform_usda_data(self, usda_data: Dict[str, Any], facility_type: str) -> Optional[Dict[str, Any]]:
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
                "subcategory": self._determine_usda_facility_subtype(facility_type, usda_data),
                "latitude": float(usda_data.get("latitude", 0)),
                "longitude": float(usda_data.get("longitude", 0)),
                "address": {
                    "street": usda_data.get("address", ""),
                    "city": usda_data.get("city", ""),
                    "state": usda_data.get("state", ""),
                    "zip_code": usda_data.get("zip_code", ""),
                    "county": usda_data.get("county", "")
                },
                "contact": {
                    "phone": usda_data.get("phone", ""),
                    "website": usda_data.get("website", ""),
                    "email": usda_data.get("email", "")
                },
                "services": self._extract_usda_services(facility_type, usda_data),
                "hours": self._extract_usda_hours(usda_data),
                "accessibility": {
                    "wheelchair_accessible": usda_data.get("wheelchair_accessible", True),
                    "public_transit": usda_data.get("public_transit", False)
                },
                "verification": {
                    "verified": True,  # USDA data is official
                    "source": "USDA",
                    "last_updated": usda_data.get("last_updated", "")
                },
                "metadata": {
                    "facility_type": facility_type,
                    "agency": self._get_usda_agency(facility_type),
                    "programs": usda_data.get("programs", []),
                    "languages": usda_data.get("languages_supported", ["English"])
                }
            }
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Error transforming USDA data: {e}")
            return None
    
    def _determine_usda_facility_subtype(self, facility_type: str, data: Dict[str, Any]) -> str:
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
    
    def _extract_usda_services(self, facility_type: str, data: Dict[str, Any]) -> List[str]:
        """Extract available services based on facility type"""
        services = []
        
        if facility_type == "rural_development":
            services.extend([
                "Rural Housing Loans",
                "Business & Industry Loans", 
                "Community Facilities Direct Loans",
                "Water & Waste Disposal Loans",
                "Rural Energy Programs",
                "Broadband Access Programs"
            ])
        elif facility_type == "snap":
            services.extend([
                "SNAP Application Assistance",
                "Food Assistance Program Information",
                "Nutrition Education",
                "Benefits Card Replacement",
                "Eligibility Screening"
            ])
        elif facility_type == "fsa":
            services.extend([
                "Farm Loans",
                "Conservation Programs", 
                "Crop Insurance",
                "Disaster Assistance",
                "Marketing Assistance Loans",
                "Commodity Programs"
            ])
        elif facility_type == "extension":
            services.extend([
                "Agricultural Education",
                "4-H Youth Programs",
                "Master Gardener Programs",
                "Family & Consumer Sciences",
                "Community Development",
                "Nutrition Education"
            ])
        elif facility_type == "wic":
            services.extend([
                "WIC Benefits",
                "Nutrition Counseling",
                "Breastfeeding Support",
                "Health Screenings",
                "Referrals to Healthcare"
            ])
        
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
            "notes": data.get("hours_notes", "Hours may vary, please call ahead")
        }
    
    def _get_usda_agency(self, facility_type: str) -> str:
        """Get the USDA agency responsible for the facility type"""
        agency_mapping = {
            "rural_development": "Rural Development (RD)",
            "snap": "Food and Nutrition Service (FNS)",
            "fsa": "Farm Service Agency (FSA)",
            "extension": "National Institute of Food and Agriculture (NIFA)",
            "wic": "Food and Nutrition Service (FNS)"
        }
        return agency_mapping.get(facility_type, "USDA")
    
    async def _get_mock_usda_facilities(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: float,
        facility_types: List[str],
        limit: int
    ) -> List[Dict[str, Any]]:
        """
        Mock USDA facilities data for demonstration
        """
        mock_facilities = []
        
        # Rural Development Office
        if "rural_development" in facility_types:
            mock_facilities.append({
                "id": "usda_rd_mock_1",
                "name": "USDA Rural Development Office",
                "category": "usda_facility",
                "subcategory": "usda_rural_development_office",
                "latitude": latitude + 0.025,
                "longitude": longitude + 0.02,
                "address": {
                    "street": "451 7th Street SW",
                    "city": "Washington",
                    "state": "DC",
                    "zip_code": "20410",
                    "county": "District of Columbia"
                },
                "contact": {
                    "phone": "(202) 692-0252",
                    "website": "https://www.rd.usda.gov/",
                    "email": "info@rd.usda.gov"
                },
                "services": [
                    "Rural Housing Loans",
                    "Business & Industry Loans",
                    "Community Facilities Direct Loans",
                    "Water & Waste Disposal Loans",
                    "Rural Energy Programs",
                    "Broadband Access Programs"
                ],
                "hours": {
                    "monday": "8:00 AM - 4:30 PM",
                    "tuesday": "8:00 AM - 4:30 PM",
                    "wednesday": "8:00 AM - 4:30 PM",
                    "thursday": "8:00 AM - 4:30 PM",
                    "friday": "8:00 AM - 4:30 PM",
                    "saturday": "Closed",
                    "sunday": "Closed",
                    "notes": "Appointments recommended"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": True
                },
                "verification": {
                    "verified": True,
                    "source": "USDA",
                    "last_updated": "2024-01-15"
                },
                "metadata": {
                    "facility_type": "rural_development",
                    "agency": "Rural Development (RD)",
                    "programs": ["Rural Housing", "Business Development", "Community Facilities"],
                    "languages": ["English", "Spanish"]
                }
            })
        
        # SNAP Office
        if "snap" in facility_types:
            mock_facilities.append({
                "id": "usda_snap_mock_1",
                "name": "SNAP/Food Assistance Office",
                "category": "usda_facility",
                "subcategory": "usda_snap_office",
                "latitude": latitude - 0.02,
                "longitude": longitude + 0.015,
                "address": {
                    "street": "3101 Park Center Dr",
                    "city": "Alexandria",
                    "state": "VA",
                    "zip_code": "22302",
                    "county": "Fairfax"
                },
                "contact": {
                    "phone": "(703) 305-2062",
                    "website": "https://www.fns.usda.gov/snap",
                    "email": "snap.info@usda.gov"
                },
                "services": [
                    "SNAP Application Assistance",
                    "Food Assistance Program Information",
                    "Nutrition Education",
                    "Benefits Card Replacement",
                    "Eligibility Screening"
                ],
                "hours": {
                    "monday": "8:00 AM - 5:00 PM",
                    "tuesday": "8:00 AM - 5:00 PM",
                    "wednesday": "8:00 AM - 5:00 PM",
                    "thursday": "8:00 AM - 5:00 PM",
                    "friday": "8:00 AM - 5:00 PM",
                    "saturday": "9:00 AM - 12:00 PM",
                    "sunday": "Closed",
                    "notes": "Walk-ins welcome, appointments available"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": True
                },
                "verification": {
                    "verified": True,
                    "source": "USDA",
                    "last_updated": "2024-01-12"
                },
                "metadata": {
                    "facility_type": "snap",
                    "agency": "Food and Nutrition Service (FNS)",
                    "programs": ["SNAP", "WIC", "School Meals"],
                    "languages": ["English", "Spanish", "French"]
                }
            })
        
        # Farm Service Agency
        if "fsa" in facility_types:
            mock_facilities.append({
                "id": "usda_fsa_mock_1",
                "name": "Farm Service Agency County Office",
                "category": "usda_facility",
                "subcategory": "usda_farm_service_center",
                "latitude": latitude + 0.01,
                "longitude": longitude - 0.025,
                "address": {
                    "street": "1400 Independence Ave SW",
                    "city": "Washington",
                    "state": "DC",
                    "zip_code": "20250",
                    "county": "District of Columbia"
                },
                "contact": {
                    "phone": "(202) 720-3467",
                    "website": "https://www.fsa.usda.gov/",
                    "email": "county.office@fsa.usda.gov"
                },
                "services": [
                    "Farm Loans",
                    "Conservation Programs",
                    "Crop Insurance",
                    "Disaster Assistance",
                    "Marketing Assistance Loans",
                    "Commodity Programs"
                ],
                "hours": {
                    "monday": "8:00 AM - 4:30 PM",
                    "tuesday": "8:00 AM - 4:30 PM",
                    "wednesday": "8:00 AM - 4:30 PM",
                    "thursday": "8:00 AM - 4:30 PM",
                    "friday": "8:00 AM - 4:30 PM",
                    "saturday": "Closed",
                    "sunday": "Closed",
                    "notes": "Farmers should call ahead during planting/harvest seasons"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": False
                },
                "verification": {
                    "verified": True,
                    "source": "USDA",
                    "last_updated": "2024-01-08"
                },
                "metadata": {
                    "facility_type": "fsa",
                    "agency": "Farm Service Agency (FSA)",
                    "programs": ["Farm Loans", "Conservation", "Crop Insurance"],
                    "languages": ["English"]
                }
            })
        
        # Filter by radius and calculate distances
        filtered_facilities = []
        user_location = (latitude, longitude)
        
        for facility in mock_facilities:
            if facility.get("latitude") and facility.get("longitude"):
                facility_location = (facility["latitude"], facility["longitude"])
                distance = geodesic(user_location, facility_location).kilometers
                
                if distance <= radius_km:
                    facility["distance_km"] = round(distance, 2)
                    filtered_facilities.append(facility)
        
        # Sort by distance and limit results
        filtered_facilities.sort(key=lambda x: x["distance_km"])
        return filtered_facilities[:limit]
    
    async def _get_mock_state_facilities(self, state_code: str, facility_types: List[str]) -> List[Dict[str, Any]]:
        """Mock facilities by state for demonstration"""
        # This would be replaced with actual USDA data retrieval
        return await self._get_mock_usda_facilities(39.0, -77.0, 1000, facility_types, 100)
    
    async def get_usda_facility_details(self, facility_id: str) -> Optional[Dict[str, Any]]:
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
                usda_id = "_".join(parts[2:])
                
                # Mock detailed facility lookup
                # In production, this would call the appropriate USDA API
                return {
                    "id": facility_id,
                    "name": f"USDA {facility_type.title()} Facility",
                    "category": "usda_facility",
                    "subcategory": self._determine_usda_facility_subtype(facility_type, {}),
                    "detailed_info": "Detailed facility information would be fetched from USDA APIs"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching USDA facility details for {facility_id}: {e}")
            return None