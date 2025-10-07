export interface Utility {
  id: string;
  name: string;
  category: UtilityCategory;
  type?: UtilityType; // For compatibility with screens
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  verified: boolean;
  wheelchair_accessible: boolean;
  isAccessible?: boolean; // Alias for wheelchair_accessible
  is24Hours?: boolean; // Additional property for 24/7 availability
  rating: number;
  rating_count: number;
  reviewCount?: number; // Alias for rating_count
  distance?: number;
  images?: string[];
  created_at: string;
  updated_at: string;
  lastUpdated?: string; // Alias for updated_at
  created_by?: string;
}

export type UtilityCategory = 
  // Basic Infrastructure
  | 'water_fountain'
  | 'restroom'
  | 'bench'
  | 'handwashing'
  | 'wifi'
  | 'charging'
  | 'transit'
  | 'library'
  // Essential Services
  | 'shelter'
  | 'free_food'
  | 'clinic'
  | 'medical'
  | 'food'
  // Government Health Services (HRSA)
  | 'health_center'
  | 'community_health_center'
  | 'migrant_health_center' 
  | 'homeless_health_center'
  | 'public_housing_health_center'
  | 'school_based_health_center'
  | 'federally_qualified_health_center'
  // VA Medical Services
  | 'va_facility'
  | 'va_medical_center'
  | 'va_outpatient_clinic'
  | 'va_vet_center'
  | 'va_regional_office'
  | 'va_cemetery'
  // USDA Services
  | 'usda_facility'
  | 'usda_rural_development_office'
  | 'usda_snap_office'
  | 'usda_farm_service_center'
  | 'usda_extension_office'
  | 'usda_wic_office'
  // Hygiene & Personal Care
  | 'shower'
  | 'laundry'
  | 'haircut'
  // Critical Support Services
  | 'legal'
  | 'social_services'
  | 'job_training'
  | 'mental_health'
  | 'addiction_services'
  | 'suicide_prevention'
  | 'domestic_violence'
  // Emergency Services
  | 'warming_center'
  | 'cooling_center'
  | 'disaster_relief'
  | 'hurricane_shelter'
  // Specialized Services
  | 'needle_exchange'
  | 'safe_injection'
  | 'pet_services'
  | 'baby_needs'
  | 'eye_care'
  | 'dental'
  | 'tax_help'
  | 'internet'
  | 'clothing';

// Alias for compatibility with other components - expanded
export type UtilityType = 
  // Basic Infrastructure
  | 'water_fountain'
  | 'water'
  | 'restroom'
  | 'charging_station'
  | 'charging'
  | 'parking'
  | 'wifi'
  | 'atm'
  | 'phone_booth'
  | 'bench'
  | 'handwashing'
  | 'transit'
  | 'library'
  // Essential Services
  | 'shelter'
  | 'food'
  | 'clinic'
  | 'medical'
  // Government Health Services (HRSA)
  | 'health_center'
  | 'community_health_center'
  | 'migrant_health_center' 
  | 'homeless_health_center'
  | 'public_housing_health_center'
  | 'school_based_health_center'
  | 'federally_qualified_health_center'
  // VA Medical Services
  | 'va_facility'
  | 'va_medical_center'
  | 'va_outpatient_clinic'
  | 'va_vet_center'
  | 'va_regional_office'
  | 'va_cemetery'
  // USDA Services
  | 'usda_facility'
  | 'usda_rural_development_office'
  | 'usda_snap_office'
  | 'usda_farm_service_center'
  | 'usda_extension_office'
  | 'usda_wic_office'
  // Hygiene & Personal Care
  | 'shower'
  | 'laundry'
  | 'haircut'
  // Critical Support Services
  | 'legal'
  | 'social_services'
  | 'job_training'
  | 'mental_health'
  | 'addiction_services'
  | 'suicide_prevention'
  | 'domestic_violence'
  // Emergency Services
  | 'warming_center'
  | 'cooling_center'
  | 'disaster_relief'
  | 'hurricane_shelter'
  // Specialized Services
  | 'needle_exchange'
  | 'safe_injection'
  | 'pet_services'
  | 'baby_needs'
  | 'eye_care'
  | 'dental'
  | 'tax_help'
  | 'internet'
  | 'clothing';

export interface UtilityFilter {
  latitude: number;
  longitude: number;
  radius: number;
  category?: UtilityCategory;
  verified_only: boolean;
  wheelchair_accessible?: boolean;
  open_now: boolean;
  limit: number;
}

export interface UtilityCreateData {
  name: string;
  category: UtilityCategory;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  wheelchair_accessible: boolean;
  images?: string[];
}

export interface Rating {
  id: string;
  utility_id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Report {
  id: string;
  utility_id: string;
  user_id?: string;
  reason: string;
  description?: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
} 