import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Utility, UtilityFilter, UtilityCreateData } from '../types/utility';
import { apiService } from '../services/apiService';

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
    (set, get) => ({
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
        limit: 50
      },

      setUtilities: (utilities: Utility[]) => {
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
        const { setLoading, setError, setUtilities, activeFilters } = get();
        
        setLoading(true);
        setError(null);

        try {
          const finalFilters = {
            ...activeFilters,
            ...filters,
            latitude,
            longitude
          };

          const utilities = await apiService.getNearbyUtilities(finalFilters as UtilityFilter);
          setUtilities(utilities);
          set({ lastFetchLocation: { latitude, longitude } });
        } catch (error) {
          console.error('Error fetching utilities:', error);
          setError('Failed to fetch nearby utilities');
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
    }),
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