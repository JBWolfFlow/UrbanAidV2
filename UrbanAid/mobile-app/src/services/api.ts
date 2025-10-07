import { Utility, UtilityType } from '../types/utility';
import { apiService } from './apiService';

export interface SearchParams {
  query?: string;
  types?: UtilityType[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Search utilities with advanced filtering
 * @param params - Search parameters
 * @returns Promise with search results
 */
export const searchUtilities = async (params: SearchParams): Promise<ApiResponse<Utility[]>> => {
  try {
    // Mock implementation for now
    console.log('Searching utilities with params:', params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data for demonstration
    const mockUtilities: Utility[] = [
      {
        id: '1',
        name: 'Central Park Water Fountain',
        category: 'water_fountain',
        type: 'water_fountain',
        latitude: 40.7829,
        longitude: -73.9654,
        description: 'Clean drinking water fountain near the playground area',
        address: 'Central Park, New York, NY',
        verified: true,
        wheelchair_accessible: true,
        isAccessible: true,
        is24Hours: true,
        rating: 4.5,
        rating_count: 23,
        reviewCount: 23,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        lastUpdated: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Public Restroom - Bryant Park',
        category: 'restroom',
        type: 'restroom',
        latitude: 40.7536,
        longitude: -73.9832,
        description: 'Clean public restroom facilities',
        address: 'Bryant Park, New York, NY',
        verified: true,
        wheelchair_accessible: true,
        isAccessible: true,
        is24Hours: false,
        rating: 4.2,
        rating_count: 45,
        reviewCount: 45,
        created_at: '2024-01-10T14:30:00Z',
        updated_at: '2024-01-10T14:30:00Z',
        lastUpdated: '2024-01-10T14:30:00Z',
      },
      {
        id: '3',
        name: 'Phone Charging Station',
        category: 'charging',
        type: 'charging_station',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'Free phone charging station with multiple ports',
        address: 'Times Square, New York, NY',
        verified: true,
        wheelchair_accessible: true,
        isAccessible: true,
        is24Hours: true,
        rating: 4.0,
        rating_count: 67,
        reviewCount: 67,
        created_at: '2024-01-05T09:15:00Z',
        updated_at: '2024-01-05T09:15:00Z',
        lastUpdated: '2024-01-05T09:15:00Z',
      },
    ];

    // Filter by query if provided
    let filteredUtilities = mockUtilities;
    if (params.query && params.query.trim()) {
      const query = params.query.toLowerCase();
      filteredUtilities = mockUtilities.filter(utility =>
        utility.name.toLowerCase().includes(query) ||
        utility.description?.toLowerCase().includes(query) ||
        utility.address?.toLowerCase().includes(query)
      );
    }

    // Filter by types if provided
    if (params.types && params.types.length > 0) {
      filteredUtilities = filteredUtilities.filter(utility =>
        params.types?.includes(utility.type || 'water_fountain')
      );
    }

    return {
      data: filteredUtilities,
      status: 200,
      message: 'Success',
    };
  } catch (error) {
    console.error('Error searching utilities:', error);
    throw new Error('Failed to search utilities');
  }
};

/**
 * Get nearby utilities
 * @param latitude - User latitude
 * @param longitude - User longitude
 * @param radius - Search radius in meters
 * @returns Promise with nearby utilities
 */
export const getNearbyUtilities = async (
  latitude: number,
  longitude: number,
  radius: number = 1000
): Promise<ApiResponse<Utility[]>> => {
  try {
    // Use the API service for this call
    const utilities = await apiService.getNearbyUtilities({
      latitude,
      longitude,
      radius,
      verified_only: false,
      open_now: false,
      limit: 50,
    });

    return {
      data: utilities,
      status: 200,
      message: 'Success',
    };
  } catch (error) {
    console.error('Error getting nearby utilities:', error);
    // Return mock data on error for development
    return searchUtilities({ latitude, longitude });
  }
};

/**
 * Create a new utility
 * @param utilityData - Utility data to create
 * @returns Promise with created utility
 */
export const createUtility = async (utilityData: Partial<Utility>): Promise<ApiResponse<Utility>> => {
  try {
    // Mock implementation for now
    console.log('Creating utility:', utilityData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUtility: Utility = {
      id: Date.now().toString(),
      name: utilityData.name || 'New Utility',
      category: 'water_fountain',
      type: utilityData.type || 'water_fountain',
      latitude: utilityData.latitude || 0,
      longitude: utilityData.longitude || 0,
      description: utilityData.description,
      address: utilityData.address,
      verified: false,
      wheelchair_accessible: utilityData.isAccessible || false,
      isAccessible: utilityData.isAccessible || false,
      is24Hours: utilityData.is24Hours || false,
      rating: 0,
      rating_count: 0,
      reviewCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    return {
      data: newUtility,
      status: 201,
      message: 'Utility created successfully',
    };
  } catch (error) {
    console.error('Error creating utility:', error);
    throw new Error('Failed to create utility');
  }
};

export default {
  searchUtilities,
  getNearbyUtilities,
  createUtility,
}; 