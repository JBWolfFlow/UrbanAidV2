import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Utility, UtilityFilter, UtilityCreateData } from '../types/utility';
import { apiService } from '../services/apiService';
import bundledUtilities from '../assets/data/utilities.json';


interface UtilityState {
  utilities: Utility[];
  selectedUtility: Utility | null;
  isLoading: boolean;
  error: string | null;
  lastFetchLocation: { latitude: number; longitude: number } | null;
  lastFetchTimestamp: number | null;
  searchQuery: string;
  activeFilters: Partial<UtilityFilter>;

  // Actions
  setUtilities: (utilities: Utility[]) => void;
  mergeUtilities: (newUtilities: Utility[]) => void;
  setLastFetchCenter: (center: { latitude: number; longitude: number }) => void;
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
        utilities: bundledUtilities as unknown as Utility[],
        selectedUtility: null,
        isLoading: false,
        error: null,
        lastFetchLocation: null,
        lastFetchTimestamp: 0,
        searchQuery: '',
        activeFilters: {
          radius: 25.0,
          verified_only: false,
          open_now: false,
          limit: 500,
        },

        setUtilities: (utilities: Utility[]) => {
          set({ utilities, error: null, lastFetchTimestamp: Date.now() });
        },

        mergeUtilities: (newUtilities: Utility[]) => {
          set((state) => {
            const existing = new Map(state.utilities.map(u => [u.id, u]));
            for (const u of newUtilities) {
              existing.set(u.id, u); // add new or update existing (fresh distance_km)
            }
            return { utilities: Array.from(existing.values()), error: null };
          });
        },

        setLastFetchCenter: (center: { latitude: number; longitude: number }) => {
          set({ lastFetchLocation: center });
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
            activeFilters: { ...state.activeFilters, ...filters },
          }));
        },

        fetchNearbyUtilities: async (latitude: number, longitude: number, filters?: Partial<UtilityFilter>) => {
          const { activeFilters } = get();

          try {
            console.log('Fetching utilities for:', latitude, longitude);

            const utilities = await apiService.getNearbyUtilities({
              ...activeFilters,
              ...filters,
              latitude,
              longitude,
            } as UtilityFilter);
            console.log(`Found ${utilities.length} utilities`);

            set({
              utilities,
              error: null,
              isLoading: false,
            });
          } catch (error) {
            console.error('Error fetching utilities:', error);
            set({
              error: 'Failed to fetch nearby utilities',
              isLoading: false,
            });
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
              utilities: [...state.utilities, newUtility],
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
                utility.id === id ? updatedUtility : utility,
              ),
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
              utilities: state.utilities.filter(utility => utility.id !== id),
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
                  : utility,
              ),
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
            utilities: bundledUtilities as unknown as Utility[],
            selectedUtility: null,
            error: null,
            lastFetchLocation: null,
            searchQuery: '',
          });
        },
      };
    },
    {
      name: 'utility-storage-v5',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Don't persist utilities — bundled JSON is the source of truth.
        // Only user-created utilities (not in bundled set) are worth persisting.
        // This prevents a ~1.6MB AsyncStorage write and the hydration re-render.
        activeFilters: state.activeFilters,
        lastFetchTimestamp: state.lastFetchTimestamp,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<UtilityState>;
        const currentState = current as UtilityState;

        // Bundled data is the source of truth for all ~4,000 pins.
        // Only append user-created utilities (IDs not in the bundled set).
        // If no user-created utilities, return the SAME array reference
        // to prevent React from re-reconciling all 4,000 <Marker> components.
        const bundledIds = new Set(
          (bundledUtilities as unknown as Utility[]).map(u => u.id),
        );
        const userCreated = (persistedState?.utilities ?? []).filter(
          u => !bundledIds.has(u.id),
        );

        return {
          ...currentState,
          ...persistedState,
          utilities: userCreated.length > 0
            ? [...currentState.utilities, ...userCreated]
            : currentState.utilities, // Same reference = zero re-render
        };
      },
    },
  ),
);
