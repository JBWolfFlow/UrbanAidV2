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
  | 'water_fountain'
  | 'restroom'
  | 'bench'
  | 'handwashing'
  | 'shelter'
  | 'free_food'
  | 'wifi'
  | 'charging'
  | 'transit'
  | 'library'
  | 'clinic';

// Alias for compatibility with other components
export type UtilityType = 
  | 'water_fountain'
  | 'restroom'
  | 'charging_station'
  | 'parking'
  | 'wifi'
  | 'atm'
  | 'phone_booth'
  | 'bench';

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