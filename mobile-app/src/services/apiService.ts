import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Utility, UtilityFilter, UtilityCreateData, Rating, TransitArrival, TransitStopInfo } from '../types/utility';
import environment from '../../env.config';

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = environment.API_URL;

    if (__DEV__) {
      console.log('[ApiService] baseURL:', this.baseURL);
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: environment.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor — only log in dev builds
    this.api.interceptors.request.use(
      (config) => {
        if (__DEV__) {
          console.log(`API ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        if (__DEV__) console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor — only log in dev builds
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`API ${response.status} ${response.config.url} (${response.data?.length || 'N/A'} items)`);
        }
        return response;
      },
      (error) => {
        if (__DEV__) {
          const axiosError = error as AxiosError;
          console.error('API Error:', {
            url: axiosError.config?.url,
            message: axiosError.message,
            status: axiosError.response?.status,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  /**
   * Get nearby utilities based on location and filters
   */
  async getNearbyUtilities(filters: UtilityFilter): Promise<Utility[]> {
    try {
      const params = {
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
        category: filters.category,
        verified_only: filters.verified_only,
        wheelchair_accessible: filters.wheelchair_accessible,
        open_now: filters.open_now,
        limit: filters.limit
      };

      const response = await this.api.get<Utility[]>('/utilities', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching nearby utilities:', error);
      throw new Error('Failed to fetch nearby utilities');
    }
  }

  /**
   * Get ALL utilities (no radius/limit) for statewide map view
   */
  async getAllUtilities(): Promise<Utility[]> {
    try {
      const startTime = Date.now();
      const response = await this.api.get<Utility[]>('/utilities/all');

      if (__DEV__) {
        console.log(`[getAllUtilities] ${response.data?.length || 0} utilities in ${Date.now() - startTime}ms`);
      }
      return response.data;
    } catch (error) {
      if (__DEV__) {
        const axiosError = error as AxiosError;
        console.error('[getAllUtilities] Failed:', axiosError.message, axiosError.code);
      }
      throw new Error('Failed to fetch all utilities');
    }
  }

  /**
   * Search utilities by query
   */
  async searchUtilities(
    query: string, 
    latitude: number, 
    longitude: number, 
    limit: number = 20
  ): Promise<Utility[]> {
    try {
      const params = {
        query,
        latitude,
        longitude,
        limit
      };

      const response = await this.api.get<Utility[]>('/search', { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error searching utilities:', error);
      throw new Error('Failed to search utilities');
    }
  }

  /**
   * Get specific utility by ID
   */
  async getUtilityById(id: string): Promise<Utility> {
    try {
      const response = await this.api.get<Utility>(`/utilities/${id}`);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching utility by ID:', error);
      throw new Error('Failed to fetch utility');
    }
  }

  /**
   * Create new utility
   */
  async createUtility(utilityData: UtilityCreateData): Promise<Utility> {
    try {
      const response = await this.api.post<Utility>('/utilities', utilityData);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error creating utility:', error);
      throw new Error('Failed to create utility');
    }
  }

  /**
   * Update existing utility
   */
  async updateUtility(id: string, updates: Partial<UtilityCreateData>): Promise<Utility> {
    try {
      const response = await this.api.put<Utility>(`/utilities/${id}`, updates);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error updating utility:', error);
      throw new Error('Failed to update utility');
    }
  }

  /**
   * Delete utility
   */
  async deleteUtility(id: string): Promise<void> {
    try {
      await this.api.delete(`/utilities/${id}`);
    } catch (error) {
      if (__DEV__) console.error('Error deleting utility:', error);
      throw new Error('Failed to delete utility');
    }
  }

  /**
   * Rate a utility
   */
  async rateUtility(utilityId: string, rating: number, comment?: string): Promise<Rating> {
    try {
      const data = { rating, comment };
      const response = await this.api.post<Rating>(`/utilities/${utilityId}/ratings`, data);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error rating utility:', error);
      throw new Error('Failed to rate utility');
    }
  }

  /**
   * Get ratings for a utility
   */
  async getUtilityRatings(utilityId: string, limit: number = 10): Promise<Rating[]> {
    try {
      const params = { limit };
      const response = await this.api.get<Rating[]>(`/utilities/${utilityId}/ratings`, { params });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching utility ratings:', error);
      throw new Error('Failed to fetch ratings');
    }
  }

  /**
   * Report a utility
   */
  async reportUtility(utilityId: string, reason: string, description?: string): Promise<void> {
    try {
      const data = { reason, description };
      await this.api.post(`/utilities/${utilityId}/report`, data);
    } catch (error) {
      if (__DEV__) console.error('Error reporting utility:', error);
      throw new Error('Failed to report utility');
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error checking API health:', error);
      throw new Error('API health check failed');
    }
  }

  /**
   * Upload image for utility
   */
  async uploadImage(imageData: FormData): Promise<{ url: string }> {
    try {
      const response = await this.api.post('/upload/image', imageData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // ========== GOVERNMENT HEALTH SERVICES (HRSA) ==========

  /**
   * Get nearby HRSA health centers
   */
  async getNearbyHealthCenters(
    latitude: number, 
    longitude: number, 
    radius_km: number = 25, 
    limit: number = 20
  ): Promise<any[]> {
    try {
      const params = { latitude, longitude, radius_km, limit };
      const response = await this.api.get('/health-centers', { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching HRSA health centers:', error);
      throw new Error('Failed to fetch HRSA health centers');
    }
  }

  /**
   * Get HRSA health centers by state
   */
  async getHealthCentersByState(stateCode: string, limit: number = 100): Promise<any[]> {
    try {
      const params = { limit };
      const response = await this.api.get(`/health-centers/state/${stateCode}`, { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching health centers by state:', error);
      throw new Error('Failed to fetch health centers by state');
    }
  }

  /**
   * Get HRSA health center details by ID
   */
  async getHealthCenterDetails(centerId: string): Promise<any> {
    try {
      const response = await this.api.get(`/health-centers/${centerId}`);
      return response.data.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching health center details:', error);
      throw new Error('Failed to fetch health center details');
    }
  }

  // ========== VA MEDICAL FACILITIES ==========

  /**
   * Get nearby VA facilities
   */
  async getNearbyVAFacilities(
    latitude: number,
    longitude: number,
    radius_miles: number = 50,
    facility_type: string = 'health',
    limit: number = 20
  ): Promise<any[]> {
    try {
      const params = { latitude, longitude, radius_miles, facility_type, limit };
      const response = await this.api.get('/va-facilities', { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching VA facilities:', error);
      throw new Error('Failed to fetch VA facilities');
    }
  }

  /**
   * Get VA facilities by state
   */
  async getVAFacilitiesByState(
    stateCode: string, 
    facility_type: string = 'health', 
    limit: number = 200
  ): Promise<any[]> {
    try {
      const params = { facility_type, limit };
      const response = await this.api.get(`/va-facilities/state/${stateCode}`, { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching VA facilities by state:', error);
      throw new Error('Failed to fetch VA facilities by state');
    }
  }

  /**
   * Get VA facility details by ID
   */
  async getVAFacilityDetails(facilityId: string): Promise<any> {
    try {
      const response = await this.api.get(`/va-facilities/${facilityId}`);
      return response.data.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching VA facility details:', error);
      throw new Error('Failed to fetch VA facility details');
    }
  }

  // ========== USDA FACILITIES ==========

  /**
   * Get nearby USDA facilities
   */
  async getNearbyUSDAFacilities(
    latitude: number,
    longitude: number,
    radius_km: number = 50,
    facility_types: string = 'rural_development,snap,fsa',
    limit: number = 20
  ): Promise<any[]> {
    try {
      const params = { latitude, longitude, radius_km, facility_types, limit };
      const response = await this.api.get('/usda-facilities', { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching USDA facilities:', error);
      throw new Error('Failed to fetch USDA facilities');
    }
  }

  /**
   * Get USDA facilities by state
   */
  async getUSDAFacilitiesByState(
    stateCode: string,
    facility_types: string = 'rural_development,snap,fsa',
    limit: number = 100
  ): Promise<any[]> {
    try {
      const params = { facility_types, limit };
      const response = await this.api.get(`/usda-facilities/state/${stateCode}`, { params });
      return response.data.data || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching USDA facilities by state:', error);
      throw new Error('Failed to fetch USDA facilities by state');
    }
  }

  /**
   * Get USDA facility details by ID
   */
  async getUSDAFacilityDetails(facilityId: string): Promise<any> {
    try {
      const response = await this.api.get(`/usda-facilities/${facilityId}`);
      return response.data.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching USDA facility details:', error);
      throw new Error('Failed to fetch USDA facility details');
    }
  }

  // ========== COMBINED DATA SEARCH ==========

  /**
   * Search all government facilities (HRSA, VA, USDA) near a location
   */
  async getAllGovernmentFacilities(
    latitude: number,
    longitude: number,
    radius_km: number = 25,
    includeHRSA: boolean = true,
    includeVA: boolean = true,
    includeUSDA: boolean = true
  ): Promise<{ hrsa: any[], va: any[], usda: any[] }> {
    try {
      const promises = [];
      
      if (includeHRSA) {
        promises.push(this.getNearbyHealthCenters(latitude, longitude, radius_km));
      }
      
      if (includeVA) {
        // Convert km to miles for VA API
        const radius_miles = radius_km * 0.621371;
        promises.push(this.getNearbyVAFacilities(latitude, longitude, radius_miles));
      }
      
      if (includeUSDA) {
        promises.push(this.getNearbyUSDAFacilities(latitude, longitude, radius_km));
      }

      const results = await Promise.allSettled(promises);
      
      const response = {
        hrsa: includeHRSA && results[0]?.status === 'fulfilled' 
          ? (results[0] as PromiseFulfilledResult<any[]>).value : [],
        va: includeVA && results[includeHRSA ? 1 : 0]?.status === 'fulfilled' 
          ? (results[includeHRSA ? 1 : 0] as PromiseFulfilledResult<any[]>).value : [],
        usda: includeUSDA && results[results.length - 1]?.status === 'fulfilled' 
          ? (results[results.length - 1] as PromiseFulfilledResult<any[]>).value : []
      };

      return response;
    } catch (error) {
      if (__DEV__) console.error('Error fetching all government facilities:', error);
      throw new Error('Failed to fetch government facilities');
    }
  }

  // ========== TRANSIT / ONEBUSAWAY ==========

  async getTransitArrivals(utilityId: string): Promise<TransitArrival[]> {
    try {
      const response: AxiosResponse = await this.api.get(`/transit/arrivals/${utilityId}`);
      return response.data.arrivals || [];
    } catch (error) {
      if (__DEV__) console.error('Error fetching transit arrivals:', error);
      return [];
    }
  }

  async getTransitStopInfo(utilityId: string): Promise<TransitStopInfo | null> {
    try {
      const response: AxiosResponse = await this.api.get(`/transit/stop-info/${utilityId}`);
      return response.data;
    } catch (error) {
      if (__DEV__) console.error('Error fetching transit stop info:', error);
      return null;
    }
  }
}

export const apiService = new ApiService(); 