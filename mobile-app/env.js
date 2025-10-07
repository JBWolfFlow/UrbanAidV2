// Environment configuration for UrbanAid
// This file contains environment variables for the mobile app

const config = {
  // API Configuration
  API_URL: __DEV__ ? 'http://localhost:8000' : 'https://api.urbanaid.com',
  
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'AIzaSyDOahtj8yxnSU71jXhaYCaPvfCpUFJRGpg',
  
  // App Configuration
  APP_NAME: 'UrbanAid',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: __DEV__ ? false : true,
  ENABLE_DEBUG_LOGS: __DEV__,
  
  // API Timeouts (in milliseconds)
  API_TIMEOUT: 10000,
  LOCATION_TIMEOUT: 15000,
  
  // Map Configuration
  MAP_INITIAL_ZOOM: 15,
  DEFAULT_SEARCH_RADIUS: 5.0, // kilometers
  MAX_SEARCH_RADIUS: 50.0,
  
  // Cache Configuration
  CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_CACHED_UTILITIES: 1000,
  
  // Location Settings
  LOCATION_ACCURACY: 'high',
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds
  
  // Offline Configuration
  OFFLINE_SYNC_INTERVAL: 30000, // 30 seconds
  MAX_OFFLINE_QUEUE_SIZE: 100,
};

export default config; 