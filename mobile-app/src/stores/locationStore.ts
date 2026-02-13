import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface LocationState {
  hasLocationPermission: boolean;
  currentLocation: Location | null;
  userLocation: Location | null; // Alias for currentLocation for compatibility
  isLocationLoading: boolean;
  locationError: string | null;
  setLocationPermission: (hasPermission: boolean) => void;
  setCurrentLocation: (location: Location | null) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  getCurrentLocation: () => Promise<Location | null>;
  watchLocation: () => number | null;
  clearLocationWatch: (watchId: number) => void;
}

/**
 * Location store for managing user location state
 * Handles permissions, current location, and location watching
 */
export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      hasLocationPermission: false,
      currentLocation: null,
      get userLocation() {
        return get().currentLocation; // Alias for currentLocation
      },
      isLocationLoading: false,
      locationError: null,

      /**
       * Set location permission status
       * @param hasPermission - Whether location permission is granted
       */
      setLocationPermission: (hasPermission: boolean) => {
        set({ hasLocationPermission: hasPermission });
      },

      /**
       * Set current user location
       * @param location - User's current location
       */
      setCurrentLocation: (location: Location | null) => {
        set({ currentLocation: location, locationError: null });
      },

      /**
       * Set location loading state
       * @param loading - Whether location is being fetched
       */
      setLocationLoading: (loading: boolean) => {
        set({ isLocationLoading: loading });
      },

      /**
       * Set location error message
       * @param error - Error message or null
       */
      setLocationError: (error: string | null) => {
        set({ locationError: error });
      },

      /**
       * Get current location using GPS
       * @returns Promise<Location | null>
       */
      getCurrentLocation: (): Promise<Location | null> => {
        return new Promise((resolve) => {
          const { hasLocationPermission, setLocationLoading, setLocationError, setCurrentLocation } = get();
          
          if (!hasLocationPermission) {
            setLocationError('Location permission not granted');
            resolve(null);
            return;
          }

          setLocationLoading(true);
          setLocationError(null);

          Geolocation.getCurrentPosition(
            (position) => {
              const location: Location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              };
              setCurrentLocation(location);
              setLocationLoading(false);
              resolve(location);
            },
            (error) => {
              console.error('Error getting location:', error);
              setLocationError(`Failed to get location: ${error.message}`);
              setLocationLoading(false);
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );
        });
      },

      /**
       * Start watching location changes
       * @returns Watch ID for clearing the watch
       */
      watchLocation: (): number | null => {
        const { hasLocationPermission, setLocationError, setCurrentLocation } = get();
        
        if (!hasLocationPermission) {
          setLocationError('Location permission not granted');
          return null;
        }

        const watchId = Geolocation.watchPosition(
          (position) => {
            const location: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };
            setCurrentLocation(location);
          },
          (error) => {
            console.error('Error watching location:', error);
            setLocationError(`Failed to watch location: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            interval: 10000,
            fastestInterval: 5000,
            distanceFilter: 10,
          }
        );

        return watchId;
      },

      /**
       * Clear location watch
       * @param watchId - Watch ID to clear
       */
      clearLocationWatch: (watchId: number) => {
        Geolocation.clearWatch(watchId);
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasLocationPermission: state.hasLocationPermission,
        // Don't persist location data for privacy
      }),
    }
  )
); 