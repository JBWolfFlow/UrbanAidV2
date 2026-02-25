/**
 * Analytics Service
 *
 * Wraps Firebase Analytics with a feature-flag gate.
 * When ENABLE_ANALYTICS is false (dev builds), all calls are no-ops.
 */

import environment from '../../env.config';
import analyticsModule from '@react-native-firebase/analytics';

type AnalyticsInstance = ReturnType<typeof analyticsModule>;
let analytics: AnalyticsInstance | null = null;

/**
 * Initialize analytics. Call once at app startup.
 */
export async function initAnalytics(): Promise<void> {
  if (!environment.ENABLE_ANALYTICS) {
    return;
  }

  try {
    analytics = analyticsModule();
    await analytics.setAnalyticsCollectionEnabled(true);
  } catch {
    if (__DEV__) {
      console.warn('[Analytics] Firebase Analytics not available');
    }
  }
}

/**
 * Log a screen view event (call on navigation state change).
 */
export function logScreenView(screenName: string): void {
  analytics?.logScreenView({ screen_name: screenName, screen_class: screenName });
}

/**
 * Log a custom event.
 */
export function logEvent(name: string, params?: Record<string, string | number>): void {
  analytics?.logEvent(name, params);
}

/**
 * Set user ID for analytics (or null to clear).
 */
export function setAnalyticsUserId(userId: string | null): void {
  analytics?.setUserId(userId);
}
