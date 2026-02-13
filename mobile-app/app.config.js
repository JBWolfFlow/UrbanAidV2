/**
 * Expo Dynamic Configuration
 *
 * Reads API keys from environment variables at build time.
 * In EAS Build, set secrets via: eas secret:create --name GOOGLE_MAPS_API_KEY --value <key>
 * For local dev, create a .env file or export vars in your shell.
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export default {
  expo: {
    name: 'UrbanAid',
    slug: 'urbanaid',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#2196F3',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.urbanaid.app',
      supportsTablet: true,
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'UrbanAid needs location access to find nearby public utilities.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'UrbanAid needs location access to find nearby public utilities.',
        NSCameraUsageDescription:
          'UrbanAid needs camera access to take photos of utilities.',
        NSPhotoLibraryUsageDescription:
          'UrbanAid needs photo library access to select utility images.',
      },
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: 'com.urbanaid.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2196F3',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '',
      },
    },
  },
};
