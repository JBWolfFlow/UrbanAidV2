import { UtilityType, UtilityCategory } from '../types/utility';

/**
 * Get icon emoji for utility type
 * @param type - Utility type or category
 * @returns Emoji string representing the utility type
 */
export const getUtilityIcon = (type: UtilityType | UtilityCategory | string): string => {
  switch (type) {
    case 'water_fountain':
      return '💧';
    case 'restroom':
      return '🚻';
    case 'charging_station':
    case 'charging':
      return '🔌';
    case 'parking':
      return '🅿️';
    case 'wifi':
      return '📶';
    case 'atm':
      return '🏧';
    case 'phone_booth':
      return '📞';
    case 'bench':
      return '🪑';
    case 'handwashing':
      return '🧼';
    case 'shelter':
      return '🏠';
    case 'free_food':
      return '🍽️';
    case 'transit':
      return '🚌';
    case 'library':
      return '📚';
    case 'clinic':
      return '🏥';
    default:
      return '📍';
  }
};

/**
 * Get display name for utility type
 * @param type - Utility type or category
 * @returns Human readable name for the utility type
 */
export const getUtilityTypeName = (type: UtilityType | UtilityCategory | string): string => {
  switch (type) {
    case 'water_fountain':
      return 'Water Fountain';
    case 'restroom':
      return 'Restroom';
    case 'charging_station':
    case 'charging':
      return 'Charging Station';
    case 'parking':
      return 'Parking';
    case 'wifi':
      return 'WiFi Hotspot';
    case 'atm':
      return 'ATM';
    case 'phone_booth':
      return 'Phone Booth';
    case 'bench':
      return 'Bench';
    case 'handwashing':
      return 'Handwashing Station';
    case 'shelter':
      return 'Shelter';
    case 'free_food':
      return 'Free Food';
    case 'transit':
      return 'Transit Stop';
    case 'library':
      return 'Library';
    case 'clinic':
      return 'Clinic';
    default:
      return 'Utility';
  }
};

/**
 * Get color for utility type
 * @param type - Utility type or category
 * @returns Hex color string for the utility type
 */
export const getUtilityTypeColor = (type: UtilityType | UtilityCategory | string): string => {
  switch (type) {
    case 'water_fountain':
      return '#2196F3'; // Blue
    case 'restroom':
      return '#9C27B0'; // Purple
    case 'charging_station':
    case 'charging':
      return '#FF9800'; // Orange
    case 'parking':
      return '#607D8B'; // Blue Gray
    case 'wifi':
      return '#4CAF50'; // Green
    case 'atm':
      return '#F44336'; // Red
    case 'phone_booth':
      return '#795548'; // Brown
    case 'bench':
      return '#8BC34A'; // Light Green
    case 'handwashing':
      return '#00BCD4'; // Cyan
    case 'shelter':
      return '#FFC107'; // Amber
    case 'free_food':
      return '#E91E63'; // Pink
    case 'transit':
      return '#3F51B5'; // Indigo
    case 'library':
      return '#009688'; // Teal
    case 'clinic':
      return '#CDDC39'; // Lime
    default:
      return '#757575'; // Gray
  }
};

/**
 * Check if utility is currently open
 * @param utility - Utility object with hours information
 * @returns Boolean indicating if utility is open now
 */
export const isUtilityOpenNow = (utility: { hours?: string; is24Hours?: boolean }): boolean => {
  // If marked as 24/7, always open
  if (utility.is24Hours) {
    return true;
  }

  // If no hours specified, assume closed
  if (!utility.hours) {
    return false;
  }

  // This is a simple implementation - in a real app you'd parse the hours string
  // and check against current time
  const now = new Date();
  const currentHour = now.getHours();
  
  // Simple heuristic: assume most utilities are open 6 AM to 10 PM
  return currentHour >= 6 && currentHour <= 22;
};

/**
 * Format utility hours for display
 * @param hours - Hours string from utility
 * @param is24Hours - Whether utility is 24/7
 * @returns Formatted hours string
 */
export const formatUtilityHours = (hours?: string, is24Hours?: boolean): string => {
  if (is24Hours) {
    return '24/7';
  }
  
  if (!hours) {
    return 'Hours not specified';
  }
  
  return hours;
};

/**
 * Get utility accessibility info
 * @param utility - Utility object with accessibility info
 * @returns Object with accessibility details
 */
export const getUtilityAccessibility = (utility: {
  wheelchair_accessible?: boolean;
  isAccessible?: boolean;
}) => {
  const isAccessible = utility.wheelchair_accessible || utility.isAccessible || false;
  
  return {
    isAccessible,
    accessibilityText: isAccessible ? 'Wheelchair accessible' : 'Accessibility unknown',
    accessibilityIcon: isAccessible ? 'wheelchair-accessibility' : 'help-circle-outline',
  };
};

/**
 * Sort utilities by distance from a point
 * @param utilities - Array of utilities with latitude/longitude
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @returns Sorted array of utilities (closest first)
 */
export const sortUtilitiesByDistance = (
  utilities: Array<{ latitude: number; longitude: number; distance?: number }>,
  userLat: number,
  userLng: number
) => {
  return utilities
    .map(utility => ({
      ...utility,
      distance: calculateDistance(userLat, userLng, utility.latitude, utility.longitude),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - First latitude
 * @param lng1 - First longitude
 * @param lat2 - Second latitude
 * @param lng2 - Second longitude
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
}; 