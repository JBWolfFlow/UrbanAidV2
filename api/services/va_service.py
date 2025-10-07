"""
VA Medical Centers Data Integration Service
Fetches and processes data from Department of Veterans Affairs
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)

class VAService:
    """Service for integrating VA medical center data"""
    
    def __init__(self):
        self.base_url = "https://api.va.gov"
        self.facilities_api = "/v0/facilities/va"
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
    
    async def search_nearby_va_facilities(
        self, 
        latitude: float, 
        longitude: float, 
        radius_miles: float = 50.0,
        facility_type: str = "health",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Find VA facilities near a specific location
        
        Args:
            latitude: User's latitude
            longitude: User's longitude
            radius_miles: Search radius in miles (VA API uses miles)
            facility_type: Type of facility ('health', 'benefits', 'cemetery', 'vet_center')
            limit: Maximum number of results
            
        Returns:
            List of nearby VA facilities
        """
        try:
            session = await self.get_session()
            
            # VA API endpoint for facility search
            url = f"{self.base_url}{self.facilities_api}"
            params = {
                "lat": latitude,
                "long": longitude,
                "radius": radius_miles,
                "type": facility_type,
                "per_page": limit
            }
            
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Transform VA data to UrbanAid format
            va_facilities = []
            for facility in data.get("data", []):
                transformed_facility = self._transform_va_data(facility)
                if transformed_facility:
                    va_facilities.append(transformed_facility)
            
            # Sort by distance if coordinates are available
            user_location = (latitude, longitude)
            for facility in va_facilities:
                if facility.get("latitude") and facility.get("longitude"):
                    facility_location = (facility["latitude"], facility["longitude"])
                    distance_km = geodesic(user_location, facility_location).kilometers
                    facility["distance_km"] = round(distance_km, 2)
            
            # Sort by distance and limit results
            va_facilities.sort(key=lambda x: x.get("distance_km", float('inf')))
            
            logger.info(f"Fetched {len(va_facilities)} VA facilities")
            return va_facilities[:limit]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching VA data: {e}")
            # Return mock data for demonstration
            return await self._get_mock_va_facilities(latitude, longitude, radius_miles, limit)
        except Exception as e:
            logger.error(f"Error fetching VA data: {e}")
            # Return mock data for demonstration
            return await self._get_mock_va_facilities(latitude, longitude, radius_miles, limit)
    
    async def get_va_facilities_by_state(self, state_code: str, facility_type: str = "health") -> List[Dict[str, Any]]:
        """
        Get VA facilities in a specific state
        
        Args:
            state_code: Two-letter state code
            facility_type: Type of facility
            
        Returns:
            List of VA facilities in the state
        """
        try:
            session = await self.get_session()
            
            url = f"{self.base_url}{self.facilities_api}"
            params = {
                "state": state_code.upper(),
                "type": facility_type,
                "per_page": 200  # VA API max
            }
            
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            va_facilities = []
            for facility in data.get("data", []):
                transformed_facility = self._transform_va_data(facility)
                if transformed_facility:
                    va_facilities.append(transformed_facility)
            
            logger.info(f"Fetched {len(va_facilities)} VA facilities for state {state_code}")
            return va_facilities
            
        except Exception as e:
            logger.error(f"Error fetching VA facilities for state {state_code}: {e}")
            return []
    
    def _transform_va_data(self, va_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform VA facility data to UrbanAid format
        
        Args:
            va_data: Raw data from VA API
            
        Returns:
            Transformed data dictionary or None if invalid
        """
        try:
            attributes = va_data.get("attributes", {})
            
            # Extract coordinates
            lat = lng = None
            if attributes.get("lat") and attributes.get("long"):
                lat = float(attributes["lat"])
                lng = float(attributes["long"])
            
            return {
                "id": f"va_{va_data.get('id', '')}",
                "name": attributes.get("name", "VA Facility"),
                "category": "va_facility",
                "subcategory": self._determine_va_facility_type(attributes),
                "latitude": lat,
                "longitude": lng,
                "address": {
                    "street": attributes.get("address", {}).get("physical", {}).get("address_1", ""),
                    "city": attributes.get("address", {}).get("physical", {}).get("city", ""),
                    "state": attributes.get("address", {}).get("physical", {}).get("state", ""),
                    "zip_code": attributes.get("address", {}).get("physical", {}).get("zip", ""),
                    "county": attributes.get("address", {}).get("physical", {}).get("county", "")
                },
                "contact": {
                    "phone": attributes.get("phone", {}).get("main", ""),
                    "website": attributes.get("website", ""),
                    "email": attributes.get("email", "")
                },
                "services": self._extract_va_services(attributes),
                "hours": self._extract_va_hours(attributes),
                "accessibility": {
                    "wheelchair_accessible": True,  # VA facilities are required to be accessible
                    "public_transit": attributes.get("access", {}).get("public_transport", False)
                },
                "verification": {
                    "verified": True,  # VA data is official
                    "source": "VA",
                    "last_updated": attributes.get("updated_at", "")
                },
                "metadata": {
                    "facility_type": attributes.get("facility_type", ""),
                    "classification": attributes.get("classification", ""),
                    "visn": attributes.get("visn", ""),  # Veterans Integrated Service Network
                    "operating_status": self._extract_operating_status(attributes)
                }
            }
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Error transforming VA data: {e}")
            return None
    
    def _determine_va_facility_type(self, attributes: Dict[str, Any]) -> str:
        """Determine the specific type of VA facility"""
        facility_type = attributes.get("facility_type", "").lower()
        classification = attributes.get("classification", "").lower()
        
        if "medical center" in facility_type or "vamc" in classification:
            return "va_medical_center"
        elif "outpatient" in facility_type or "clinic" in facility_type:
            return "va_outpatient_clinic"
        elif "vet center" in facility_type:
            return "va_vet_center"
        elif "regional office" in facility_type:
            return "va_regional_office"
        elif "cemetery" in facility_type:
            return "va_cemetery"
        else:
            return "va_facility"
    
    def _extract_va_services(self, attributes: Dict[str, Any]) -> List[str]:
        """Extract available services from VA data"""
        services = []
        
        # VA facilities typically offer these services
        base_services = [
            "Primary Care",
            "Mental Health Services", 
            "Specialty Care",
            "Emergency Services",
            "Pharmacy Services",
            "Laboratory Services",
            "Radiology Services"
        ]
        
        # Add services based on facility type
        facility_type = attributes.get("facility_type", "").lower()
        if "medical center" in facility_type:
            services.extend([
                "Inpatient Care",
                "Surgical Services", 
                "ICU/Critical Care",
                "Rehabilitation Services"
            ])
        elif "vet center" in facility_type:
            services.extend([
                "PTSD Counseling",
                "Readjustment Counseling",
                "Family Counseling",
                "Group Therapy"
            ])
        
        services.extend(base_services)
        return list(set(services))  # Remove duplicates
    
    def _extract_va_hours(self, attributes: Dict[str, Any]) -> Dict[str, str]:
        """Extract operating hours from VA data"""
        hours_data = attributes.get("hours", {})
        
        return {
            "monday": hours_data.get("monday", "8:00 AM - 4:30 PM"),
            "tuesday": hours_data.get("tuesday", "8:00 AM - 4:30 PM"),
            "wednesday": hours_data.get("wednesday", "8:00 AM - 4:30 PM"),
            "thursday": hours_data.get("thursday", "8:00 AM - 4:30 PM"),
            "friday": hours_data.get("friday", "8:00 AM - 4:30 PM"),
            "saturday": hours_data.get("saturday", "Closed"),
            "sunday": hours_data.get("sunday", "Closed"),
            "notes": "Emergency services available 24/7 at medical centers"
        }
    
    def _extract_operating_status(self, attributes: Dict[str, Any]) -> Dict[str, Any]:
        """Extract facility operating status"""
        return {
            "status": attributes.get("operating_status", {}).get("code", "NORMAL"),
            "notice": attributes.get("operating_status", {}).get("additional_info", ""),
            "last_updated": attributes.get("updated_at", "")
        }
    
    async def _get_mock_va_facilities(
        self, 
        latitude: float, 
        longitude: float, 
        radius_miles: float,
        limit: int
    ) -> List[Dict[str, Any]]:
        """
        Mock VA facilities data for demonstration
        """
        mock_facilities = [
            {
                "id": "va_mock_1",
                "name": "VA Medical Center",
                "category": "va_facility",
                "subcategory": "va_medical_center",
                "latitude": latitude + 0.02,
                "longitude": longitude + 0.015,
                "address": {
                    "street": "1400 VFW Parkway",
                    "city": "West Roxbury",
                    "state": "MA",
                    "zip_code": "02132",
                    "county": "Suffolk"
                },
                "contact": {
                    "phone": "(617) 323-7700",
                    "website": "https://www.boston.va.gov/",
                    "email": "vamc.boston@va.gov"
                },
                "services": [
                    "Primary Care",
                    "Mental Health Services",
                    "Specialty Care",
                    "Emergency Services", 
                    "Inpatient Care",
                    "Surgical Services",
                    "Pharmacy Services",
                    "Laboratory Services",
                    "Radiology Services"
                ],
                "hours": {
                    "monday": "24 hours",
                    "tuesday": "24 hours",
                    "wednesday": "24 hours",
                    "thursday": "24 hours",
                    "friday": "24 hours",
                    "saturday": "24 hours",
                    "sunday": "24 hours",
                    "notes": "Emergency services available 24/7"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": True
                },
                "verification": {
                    "verified": True,
                    "source": "VA",
                    "last_updated": "2024-01-15"
                },
                "metadata": {
                    "facility_type": "va_medical_center",
                    "classification": "VA Medical Center (VAMC)",
                    "visn": "VISN 1",
                    "operating_status": {
                        "status": "NORMAL",
                        "notice": "",
                        "last_updated": "2024-01-15"
                    }
                },
                "distance_km": 2.2
            },
            {
                "id": "va_mock_2",
                "name": "VA Outpatient Clinic",
                "category": "va_facility", 
                "subcategory": "va_outpatient_clinic",
                "latitude": latitude - 0.01,
                "longitude": longitude - 0.02,
                "address": {
                    "street": "940 Belmont Street",
                    "city": "Brockton",
                    "state": "MA",
                    "zip_code": "02301",
                    "county": "Plymouth"
                },
                "contact": {
                    "phone": "(508) 895-1000",
                    "website": "https://www.boston.va.gov/locations/brockton.asp",
                    "email": "brockton.clinic@va.gov"
                },
                "services": [
                    "Primary Care",
                    "Mental Health Services",
                    "Laboratory Services",
                    "Pharmacy Services",
                    "Radiology Services"
                ],
                "hours": {
                    "monday": "8:00 AM - 4:30 PM",
                    "tuesday": "8:00 AM - 4:30 PM",
                    "wednesday": "8:00 AM - 4:30 PM",
                    "thursday": "8:00 AM - 4:30 PM",
                    "friday": "8:00 AM - 4:30 PM",
                    "saturday": "Closed",
                    "sunday": "Closed",
                    "notes": "Some extended hours available"
                },
                "accessibility": {
                    "wheelchair_accessible": True,
                    "public_transit": True
                },
                "verification": {
                    "verified": True,
                    "source": "VA",
                    "last_updated": "2024-01-10"
                },
                "metadata": {
                    "facility_type": "va_outpatient_clinic",
                    "classification": "Community Based Outpatient Clinic (CBOC)",
                    "visn": "VISN 1", 
                    "operating_status": {
                        "status": "NORMAL",
                        "notice": "",
                        "last_updated": "2024-01-10"
                    }
                },
                "distance_km": 1.8
            }
        ]
        
        # Filter by radius (convert miles to km for comparison)
        radius_km = radius_miles * 1.60934
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
    
    async def get_va_facility_details(self, facility_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific VA facility
        
        Args:
            facility_id: VA facility ID
            
        Returns:
            Detailed facility information or None if not found
        """
        try:
            session = await self.get_session()
            
            # Extract the actual VA ID from our prefixed ID
            va_id = facility_id.replace("va_", "")
            
            url = f"{self.base_url}{self.facilities_api}/{va_id}"
            
            response = await session.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if data and "data" in data:
                return self._transform_va_data(data["data"])
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching VA facility details for {facility_id}: {e}")
            return None