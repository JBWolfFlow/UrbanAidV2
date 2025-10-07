/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Check if coordinates are valid
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns Whether coordinates are valid
 */
export const isValidCoordinate = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Get coordinates from address string (mock implementation)
 * In a real app, this would use a geocoding service
 * @param address - Address string
 * @returns Promise with coordinates or null
 */
export const geocodeAddress = async (address: string): Promise<{latitude: number, longitude: number} | null> => {
  // Mock implementation - in real app use Google Geocoding API or similar
  console.log('Geocoding address:', address);
  return null;
};

/**
 * Get address from coordinates (mock implementation)
 * In a real app, this would use a reverse geocoding service
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Promise with address string or null
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  // Mock implementation - in real app use Google Reverse Geocoding API or similar
  console.log('Reverse geocoding:', latitude, longitude);
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}; 