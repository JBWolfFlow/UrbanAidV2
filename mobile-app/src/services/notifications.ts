/**
 * Push Notification Service
 *
 * Handles permission requests, token registration, and incoming notifications.
 * Uses expo-notifications which wraps APNs (iOS) and FCM (Android).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 * Returns null if permissions denied or running in simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn('[Notifications] Push notifications require a physical device');
    }
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'ecf5c188-010a-4e84-9e45-2b3cae4acb92',
  });

  return tokenData.data;
}

/**
 * Listen for incoming notifications (foreground).
 * Returns a subscription that should be cleaned up on unmount.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listen for notification interactions (user tapped).
 * Returns a subscription that should be cleaned up on unmount.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
