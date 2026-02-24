/**
 * Pre-rendered glassmorphic marker images with category icons.
 * Using native `image` prop instead of custom <View> children
 * gives us zero RN bridge overhead — critical for 3,600+ markers.
 *
 * Each marker is a 32×32 @1x (64 @2x, 96 @3x) glassmorphic circle
 * with a white category icon baked in.
 */
import { ImageRequireSource } from 'react-native';

// Map category → require(). React Native resolves @2x/@3x automatically.
const imageByCategory: Record<string, ImageRequireSource> = {
  // Water
  water_fountain: require('../assets/markers/marker_water_fountain.png'),
  water: require('../assets/markers/marker_water.png'),
  handwashing: require('../assets/markers/marker_handwashing.png'),

  // Restroom
  restroom: require('../assets/markers/marker_restroom.png'),

  // Charging
  charging_station: require('../assets/markers/marker_charging_station.png'),

  // Shelter
  shelter: require('../assets/markers/marker_shelter.png'),
  warming_center: require('../assets/markers/marker_warming_center.png'),
  cooling_center: require('../assets/markers/marker_cooling_center.png'),
  hurricane_shelter: require('../assets/markers/marker_hurricane_shelter.png'),

  // Food
  food: require('../assets/markers/marker_food.png'),
  free_food: require('../assets/markers/marker_free_food.png'),

  // Health
  health: require('../assets/markers/marker_health.png'),
  health_center: require('../assets/markers/marker_health_center.png'),
  clinic: require('../assets/markers/marker_clinic.png'),
  medical: require('../assets/markers/marker_medical.png'),

  // WiFi
  wifi: require('../assets/markers/marker_wifi.png'),
  internet: require('../assets/markers/marker_internet.png'),

  // Library
  library: require('../assets/markers/marker_library.png'),

  // Transit
  transit: require('../assets/markers/marker_transit.png'),

  // Bench
  bench: require('../assets/markers/marker_bench.png'),

  // VA
  va_facility: require('../assets/markers/marker_va_facility.png'),

  // USDA
  usda: require('../assets/markers/marker_usda.png'),

  // Shower
  shower: require('../assets/markers/marker_shower.png'),

  // Laundry
  laundry: require('../assets/markers/marker_laundry.png'),

  // Legal
  legal: require('../assets/markers/marker_legal.png'),

  // Social services
  social_services: require('../assets/markers/marker_social_services.png'),

  // Job training
  job_training: require('../assets/markers/marker_job_training.png'),

  // Mental health
  mental_health: require('../assets/markers/marker_mental_health.png'),

  // Clothing
  clothing: require('../assets/markers/marker_clothing.png'),

  // Needle exchange
  needle_exchange: require('../assets/markers/marker_needle_exchange.png'),

  // Pet services
  pet_services: require('../assets/markers/marker_pet_services.png'),

  // Baby needs
  baby_needs: require('../assets/markers/marker_baby_needs.png'),

  // Dental
  dental: require('../assets/markers/marker_dental.png'),

  // Eye care
  eye_care: require('../assets/markers/marker_eye_care.png'),

  // Haircut
  haircut: require('../assets/markers/marker_haircut.png'),

  // Tax help
  tax_help: require('../assets/markers/marker_tax_help.png'),

  // Parking
  parking: require('../assets/markers/marker_parking.png'),

  // Disaster relief
  disaster_relief: require('../assets/markers/marker_disaster_relief.png'),
};

const defaultImage: ImageRequireSource = require('../assets/markers/marker_default.png');

// Tiny transparent PNG — used to hide markers without unmounting them.
// GMSMarker.opacity doesn't respond to React prop updates, so we swap
// the image to a transparent pixel instead.
export const HIDDEN_MARKER_IMAGE: ImageRequireSource = require('../assets/markers/marker_hidden.png');

// Cache: normalized category → image source (avoids repeated prefix matching)
const categoryCache = new Map<string, ImageRequireSource>();

/**
 * Get the native marker image for a utility category.
 * Matches exact category names first, then uses prefix matching
 * for grouped categories (va_*, usda_*, health_center variants).
 */
export function getMarkerImage(category: string): ImageRequireSource {
  const cached = categoryCache.get(category);
  if (cached) {return cached;}

  const lower = category.toLowerCase().replace(/[\s-]/g, '_');

  // Exact match first
  let img = imageByCategory[lower];

  // Prefix matching for grouped categories
  if (!img) {
    if (lower.startsWith('va_')) {img = imageByCategory.va_facility;}
    else if (lower.startsWith('usda_')) {img = imageByCategory.usda;}
    else if (lower.includes('health_center') || lower.startsWith('community_health') ||
             lower.startsWith('migrant_health') || lower.startsWith('homeless_health') ||
             lower.startsWith('public_housing_health') || lower.startsWith('school_based_health') ||
             lower.startsWith('federally_qualified')) {img = imageByCategory.health_center;}
    else if (lower === 'safe_injection') {img = imageByCategory.needle_exchange;}
    else if (lower === 'addiction_services' || lower === 'suicide_prevention' ||
             lower === 'domestic_violence') {img = imageByCategory.mental_health;}
  }

  const result = img || defaultImage;
  categoryCache.set(category, result);
  return result;
}
