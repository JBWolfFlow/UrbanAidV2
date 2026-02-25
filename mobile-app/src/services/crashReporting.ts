/**
 * Crash Reporting Service
 *
 * Wraps Firebase Crashlytics with a feature-flag gate.
 * When ENABLE_CRASH_REPORTING is false (dev builds), all calls are no-ops.
 * When true (production builds), errors are forwarded to Crashlytics.
 */

import environment from '../../env.config';
import crashlyticsModule from '@react-native-firebase/crashlytics';

type CrashlyticsInstance = ReturnType<typeof crashlyticsModule>;
let crashlytics: CrashlyticsInstance | null = null;

/**
 * Initialize crash reporting. Call once at app startup.
 * Safe to call in any environment — no-ops when disabled or unavailable.
 */
export async function initCrashReporting(): Promise<void> {
  if (!environment.ENABLE_CRASH_REPORTING) {
    return;
  }

  try {
    crashlytics = crashlyticsModule();
    await crashlytics.setCrashlyticsCollectionEnabled(true);
  } catch {
    // Firebase not configured yet — silent no-op in dev
    if (__DEV__) {
      console.warn('[CrashReporting] Firebase Crashlytics not available');
    }
  }
}

/**
 * Record a non-fatal error (e.g., from ErrorBoundary or caught exceptions).
 */
export function recordError(error: Error, context?: string): void {
  if (!crashlytics) {
    if (__DEV__) {
      console.error(`[CrashReporting] ${context ?? 'Error'}:`, error.message);
    }
    return;
  }

  if (context) {
    crashlytics.log(context);
  }
  crashlytics.recordError(error);
}

/**
 * Log a breadcrumb message for crash context.
 */
export function log(message: string): void {
  crashlytics?.log(message);
}

/**
 * Set the current user ID for crash reports.
 * Pass null to clear.
 */
export function setUserId(userId: string | null): void {
  if (!crashlytics) { return; }
  crashlytics.setUserId(userId ?? '');
}

/**
 * Set custom key-value attributes on crash reports.
 */
export function setAttribute(key: string, value: string): void {
  crashlytics?.setAttribute(key, value);
}
