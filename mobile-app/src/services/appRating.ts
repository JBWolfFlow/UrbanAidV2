/**
 * App Rating Service
 *
 * Prompts users for an App Store review after meaningful engagement.
 * Uses expo-store-review which calls SKStoreReviewController on iOS
 * (Apple controls when/if the dialog actually appears — max 3x/year).
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@urbanaid/app_rating';
const MIN_SESSIONS = 5;
const MIN_DAYS_SINCE_INSTALL = 3;

interface RatingState {
  installDate: number;
  sessionCount: number;
  hasRequested: boolean;
}

async function getState(): Promise<RatingState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) { return JSON.parse(raw); }
  const initial: RatingState = {
    installDate: Date.now(),
    sessionCount: 0,
    hasRequested: false,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

/**
 * Call on each app launch. Increments session count and triggers
 * the review prompt once engagement thresholds are met.
 */
export async function trackSessionAndMaybePrompt(): Promise<void> {
  try {
    const state = await getState();
    state.sessionCount += 1;

    const daysSinceInstall = (Date.now() - state.installDate) / (1000 * 60 * 60 * 24);
    const eligible =
      !state.hasRequested &&
      state.sessionCount >= MIN_SESSIONS &&
      daysSinceInstall >= MIN_DAYS_SINCE_INSTALL;

    if (eligible && await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      state.hasRequested = true;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-critical — never crash the app for a rating prompt
  }
}
