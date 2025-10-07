import { UtilityType, UtilityCategory } from '../types/utility';

/**
 * COMPREHENSIVE icon emoji mapping for ALL utility types
 * This ensures every utility type has a consistent, accurate icon
 * @param type - Utility type or category
 * @returns Emoji string representing the utility type
 */
export const getUtilityIcon = (type: UtilityType | UtilityCategory | string): string => {
  switch (type) {
    // Basic Infrastructure - WATER
    case 'water_fountain':
    case 'water':
      return '💧';
    
    // Basic Infrastructure - RESTROOMS
    case 'restroom':
      return '🚻';
    
    // Basic Infrastructure - CHARGING  
    case 'charging_station':
    case 'charging':
      return '🔌';
    
    // Basic Infrastructure - PARKING
    case 'parking':
      return '🅿️';
    
    // Basic Infrastructure - WIFI
    case 'wifi':
      return '📶';
    
    // Basic Infrastructure - ATM
    case 'atm':
      return '🏧';
    
    // Basic Infrastructure - PHONE
    case 'phone_booth':
      return '📞';
    
    // Basic Infrastructure - SEATING
    case 'bench':
      return '🪑';
    
    // Basic Infrastructure - HYGIENE
    case 'handwashing':
      return '🧼';
    
    // Transportation
    case 'transit':
      return '🚌';
    
    // Information/Education
    case 'library':
      return '📚';
    
    // Essential Services - SHELTER
    case 'shelter':
      return '🏠';
    
    // Essential Services - FOOD
    case 'free_food':
    case 'food':
      return '🍽️';
    
    // Essential Services - MEDICAL
    case 'clinic':
    case 'medical':
      return '🏥';
    
    // Hygiene & Personal Care
    case 'shower':
      return '🚿';
    case 'laundry':
      return '🧺';
    case 'haircut':
      return '✂️';
    
    // Critical Support Services
    case 'legal':
      return '⚖️';
    case 'social_services':
      return '🏛️';
    case 'job_training':
      return '💼';
    case 'mental_health':
      return '🧠';
    case 'addiction_services':
      return '🔄';
    case 'suicide_prevention':
      return '☎️';
    case 'domestic_violence':
      return '🛡️';
    
    // Emergency Services
    case 'warming_center':
      return '🔥';
    case 'cooling_center':
      return '❄️';
    case 'disaster_relief':
      return '🌪️';
    case 'hurricane_shelter':
      return '🌀';
    
    // Specialized Services
    case 'needle_exchange':
    case 'safe_injection':
      return '💉';
    case 'pet_services':
      return '🐕';
    case 'baby_needs':
      return '👶';
    case 'eye_care':
      return '👓';
    case 'dental':
      return '🦷';
    case 'tax_help':
      return '📋';
    case 'internet':
      return '💻';
    case 'clothing':
      return '👕';
    
    // Default fallback
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
    // Basic Infrastructure
    case 'water_fountain':
    case 'water':
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
    case 'transit':
      return 'Transit Stop';
    case 'library':
      return 'Library';
    
    // Essential Services
    case 'shelter':
      return 'Emergency Shelter';
    case 'free_food':
    case 'food':
      return 'Free Food';
    case 'clinic':
    case 'medical':
      return 'Medical Clinic';
    
    // Hygiene & Personal Care
    case 'shower':
      return 'Shower Facility';
    case 'laundry':
      return 'Laundry Service';
    case 'haircut':
      return 'Free Haircuts';
    
    // Critical Support Services
    case 'legal':
      return 'Legal Aid';
    case 'social_services':
      return 'Social Services';
    case 'job_training':
      return 'Job Training';
    case 'mental_health':
      return 'Mental Health Support';
    case 'addiction_services':
      return 'Addiction Recovery';
    case 'suicide_prevention':
      return 'Crisis Support';
    case 'domestic_violence':
      return 'DV Safe House';
    
    // Emergency Services
    case 'warming_center':
      return 'Warming Center';
    case 'cooling_center':
      return 'Cooling Center';
    case 'disaster_relief':
      return 'Disaster Relief';
    case 'hurricane_shelter':
      return 'Hurricane Shelter';
    
    // Specialized Services
    case 'needle_exchange':
      return 'Needle Exchange';
    case 'safe_injection':
      return 'Safe Injection Site';
    case 'pet_services':
      return 'Pet Food Bank';
    case 'baby_needs':
      return 'Baby Supplies';
    case 'eye_care':
      return 'Free Eye Care';
    case 'dental':
      return 'Free Dental Care';
    case 'tax_help':
      return 'Tax Preparation';
    case 'internet':
      return 'Computer Center';
    case 'clothing':
      return 'Clothing Bank';
    
    default:
      return 'Public Utility';
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