// UrbanAid Environment Configuration
//
// API_URL resolution order:
// 1. URBANAID_API_URL env var (set via EAS secrets for production builds)
// 2. __DEV__ detection: local IP for dev, production URL for release builds

const DEV_API_URL = 'http://10.0.0.175:8000';
const PROD_API_URL = 'https://api.urbanaid.org';

const isProduction = !__DEV__;

const environment = {
  // API Configuration
  API_URL: process.env.URBANAID_API_URL || (isProduction ? PROD_API_URL : DEV_API_URL),

  // App Configuration
  APP_NAME: 'UrbanAid',
  APP_VERSION: '1.0.0',

  // Feature Flags — automatically set by build type
  ENABLE_ANALYTICS: isProduction,
  ENABLE_CRASH_REPORTING: isProduction,
  ENABLE_DEBUG_LOGS: !isProduction,

  // API Timeouts (milliseconds)
  API_TIMEOUT: 30000,
  LOCATION_TIMEOUT: 15000,

  // Map Configuration
  MAP_INITIAL_ZOOM: 15,
  DEFAULT_SEARCH_RADIUS: 5.0,
  MAX_SEARCH_RADIUS: 50.0,
};

export default environment;

// For CommonJS compatibility
module.exports = environment;
