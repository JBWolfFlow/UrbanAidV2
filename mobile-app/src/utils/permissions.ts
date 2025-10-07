import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Request location permission from the user
 * Handles both iOS and Android platforms
 * @returns Promise<boolean> - Whether permission was granted
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await requestAndroidLocationPermission();
    } else {
      return await requestIOSLocationPermission();
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Request location permission on Android
 * @returns Promise<boolean>
 */
const requestAndroidLocationPermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'UrbanAid needs access to your location to find nearby utilities.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      showLocationPermissionAlert();
      return false;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error requesting Android location permission:', error);
    return false;
  }
};

/**
 * Request location permission on iOS
 * @returns Promise<boolean>
 */
const requestIOSLocationPermission = async (): Promise<boolean> => {
  try {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    
    switch (result) {
      case RESULTS.GRANTED:
        return true;
      case RESULTS.DENIED:
        return false;
      case RESULTS.BLOCKED:
        showLocationPermissionAlert();
        return false;
      case RESULTS.UNAVAILABLE:
        console.warn('Location services unavailable');
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error requesting iOS location permission:', error);
    return false;
  }
};

/**
 * Check if location permission is currently granted
 * @returns Promise<boolean>
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === true;
    } else {
      const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Show alert for location permission when blocked/denied
 * Provides option to open app settings
 */
const showLocationPermissionAlert = (): void => {
  Alert.alert(
    'Location Permission Required',
    'UrbanAid needs location access to show nearby public utilities. Please enable location permission in your device settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]
  );
};

/**
 * Request camera permission for photo uploads
 * @returns Promise<boolean>
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'UrbanAid needs camera access to take photos of utilities.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.CAMERA);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Request photo library permission for image selection
 * @returns Promise<boolean>
 */
export const requestPhotoLibraryPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Photo Library Permission',
          message: 'UrbanAid needs photo library access to select images.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    return false;
  }
}; 