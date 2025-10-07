import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Utility, UtilityFilter, UtilityCreateData } from '../types/utility';
import { apiService } from '../services/apiService';

// Debounce utility to prevent rapid updates
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface UtilityState {
  utilities: Utility[];
  selectedUtility: Utility | null;
  isLoading: boolean;
  error: string | null;
  lastFetchLocation: { latitude: number; longitude: number } | null;
  searchQuery: string;
  activeFilters: Partial<UtilityFilter>;
  
  // Actions
  setUtilities: (utilities: Utility[]) => void;
  setSelectedUtility: (utility: Utility | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<UtilityFilter>) => void;
  
  // API Actions
  fetchNearbyUtilities: (latitude: number, longitude: number, filters?: Partial<UtilityFilter>) => Promise<void>;
  searchUtilities: (query: string, latitude: number, longitude: number) => Promise<void>;
  createUtility: (utilityData: UtilityCreateData) => Promise<Utility | null>;
  updateUtility: (id: string, updates: Partial<UtilityCreateData>) => Promise<void>;
  deleteUtility: (id: string) => Promise<void>;
  rateUtility: (utilityId: string, rating: number, comment?: string) => Promise<void>;
  reportUtility: (utilityId: string, reason: string, description?: string) => Promise<void>;
  
  // Offline Support
  syncOfflineData: () => Promise<void>;
  clearCache: () => void;
}

export const useUtilityStore = create<UtilityState>()(
  persist(
    (set, get) => {
      return {
        utilities: [],
        selectedUtility: null,
        isLoading: false,
        error: null,
        lastFetchLocation: null,
        searchQuery: '',
        activeFilters: {
          radius: 5.0,
          verified_only: false,
          open_now: false,
          limit: 2000
        },

        setUtilities: (utilities: Utility[]) => {
          // Set utilities immediately - no debouncing to prevent race conditions
          set({ utilities, error: null });
        },

        setSelectedUtility: (utility: Utility | null) => {
          set({ selectedUtility: utility });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        setSearchQuery: (query: string) => {
          set({ searchQuery: query });
        },

        setActiveFilters: (filters: Partial<UtilityFilter>) => {
          set(state => ({
            activeFilters: { ...state.activeFilters, ...filters }
          }));
        },

        fetchNearbyUtilities: async (latitude: number, longitude: number, filters?: Partial<UtilityFilter>) => {
          const { setLoading, setError, setUtilities, activeFilters, lastFetchLocation } = get();
          
          // Check if we're fetching the same location to prevent unnecessary calls
          if (lastFetchLocation && 
              Math.abs(lastFetchLocation.latitude - latitude) < 0.001 && 
              Math.abs(lastFetchLocation.longitude - longitude) < 0.001) {
            return; // Skip if location is essentially the same
          }
          
          setLoading(true);
          setError(null);

          try {
            console.log('🚻 Fetching comprehensive utilities including restrooms...');
            
            // Import and use comprehensive restroom API
            const { restroomAPI } = require('../services/restroomAPI');
            const { searchUtilities } = require('../services/api');
            
            // Use the enhanced search utilities function that includes comprehensive restroom data
            const utilities = await searchUtilities({
              latitude,
              longitude,
              radius: (filters?.radius || activeFilters.radius || 5) * 1000, // Convert km to meters
              types: filters?.category ? [filters.category] : undefined,
              verified_only: filters?.verified_only || activeFilters.verified_only,
              wheelchair_accessible: filters?.wheelchair_accessible,
              open_now: filters?.open_now || activeFilters.open_now,
              limit: filters?.limit || activeFilters.limit || 2000, // Increased for comprehensive 50-state coverage
            });
            console.log(`✅ Found ${utilities.length} utilities (including ${utilities.filter((u: Utility) => u.type === 'restroom').length} restrooms)`);
            
            setUtilities(utilities);
            set({ lastFetchLocation: { latitude, longitude } });
          } catch (error) {
            console.error('Error fetching utilities:', error);
            setError('Failed to fetch nearby utilities');
            
            // Fallback to basic utilities if comprehensive fetch fails
            try {
              const utilities = await apiService.getNearbyUtilities({
                ...activeFilters,
                ...filters,
                latitude,
                longitude
              } as UtilityFilter);
              setUtilities(utilities);
            } catch (fallbackError) {
              console.error('Fallback fetch also failed:', fallbackError);
            }
          } finally {
            setLoading(false);
          }
        },

        searchUtilities: async (query: string, latitude: number, longitude: number) => {
          const { setLoading, setError, setUtilities } = get();
          
          setLoading(true);
          setError(null);

          try {
            const utilities = await apiService.searchUtilities(query, latitude, longitude);
            setUtilities(utilities);
          } catch (error) {
            console.error('Error searching utilities:', error);
            setError('Failed to search utilities');
          } finally {
            setLoading(false);
          }
        },

        createUtility: async (utilityData: UtilityCreateData): Promise<Utility | null> => {
          const { setLoading, setError } = get();
          
          setLoading(true);
          setError(null);

          try {
            const newUtility = await apiService.createUtility(utilityData);
            
            // Add to local state
            set(state => ({
              utilities: [...state.utilities, newUtility]
            }));
            
            return newUtility;
          } catch (error) {
            console.error('Error creating utility:', error);
            setError('Failed to create utility');
            return null;
          } finally {
            setLoading(false);
          }
        },

        updateUtility: async (id: string, updates: Partial<UtilityCreateData>) => {
          const { setLoading, setError } = get();
          
          setLoading(true);
          setError(null);

          try {
            const updatedUtility = await apiService.updateUtility(id, updates);
            
            // Update local state
            set(state => ({
              utilities: state.utilities.map(utility => 
                utility.id === id ? updatedUtility : utility
              )
            }));
          } catch (error) {
            console.error('Error updating utility:', error);
            setError('Failed to update utility');
          } finally {
            setLoading(false);
          }
        },

        deleteUtility: async (id: string) => {
          const { setLoading, setError } = get();
          
          setLoading(true);
          setError(null);

          try {
            await apiService.deleteUtility(id);
            
            // Remove from local state
            set(state => ({
              utilities: state.utilities.filter(utility => utility.id !== id)
            }));
          } catch (error) {
            console.error('Error deleting utility:', error);
            setError('Failed to delete utility');
          } finally {
            setLoading(false);
          }
        },

        rateUtility: async (utilityId: string, rating: number, comment?: string) => {
          try {
            await apiService.rateUtility(utilityId, rating, comment);
            
            // Update utility rating in local state
            set(state => ({
              utilities: state.utilities.map(utility => 
                utility.id === utilityId 
                  ? { ...utility, rating: rating } // Simplified - should calculate average
                  : utility
              )
            }));
          } catch (error) {
            console.error('Error rating utility:', error);
            set({ error: 'Failed to rate utility' });
          }
        },

        reportUtility: async (utilityId: string, reason: string, description?: string) => {
          try {
            await apiService.reportUtility(utilityId, reason, description);
          } catch (error) {
            console.error('Error reporting utility:', error);
            set({ error: 'Failed to report utility' });
          }
        },

        syncOfflineData: async () => {
          // Implement offline sync logic
          console.log('Syncing offline data...');
        },

        clearCache: () => {
          set({
            utilities: [],
            selectedUtility: null,
            error: null,
            lastFetchLocation: null,
            searchQuery: ''
          });
        }
      };
    },
    {
      name: 'utility-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        utilities: state.utilities,
        activeFilters: state.activeFilters,
        lastFetchLocation: state.lastFetchLocation
      }),
    }
  )
); 