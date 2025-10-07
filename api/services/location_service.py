"""Location service for geographic operations"""

class LocationService:
    """Service for location-related operations"""
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates"""
        # Mock implementation - return random distance
        return 1.5
    
    def get_nearby_points(self, latitude: float, longitude: float, radius: float):
        """Get nearby points within radius"""
        # Mock implementation
        return [] 