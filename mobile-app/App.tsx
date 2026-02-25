import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import screens from src/screens
import MapScreen from './src/screens/MapScreen';
import SearchScreen from './src/screens/SearchScreen';
import AddUtilityScreen from './src/screens/AddUtilityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Import theme
import { useThemeStore } from './src/stores/themeStore';
import { colors } from './src/theme/colors';
import { tokens } from './src/theme/tokens';

// Import stores
import { useOnboardingStore } from './src/stores/onboardingStore';

// Import custom tab bar
import { GlassTabBar } from './src/components/ui/GlassTabBar';

// Import i18n
import { initializeI18n } from './src/services/i18n';

// Import crash reporting
import { initCrashReporting, recordError } from './src/services/crashReporting';

// Import app rating
import { trackSessionAndMaybePrompt } from './src/services/appRating';

// Import analytics
import { initAnalytics, logScreenView } from './src/services/analytics';

// Import notifications
import { registerForPushNotifications } from './src/services/notifications';

// ── Error Boundary ──────────────────────────────────────────────────
// Catches unhandled JS errors and shows a recovery screen instead of a
// white screen crash. Required for App Store approval.

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
    recordError(error, `ErrorBoundary: ${info.componentStack?.slice(0, 200) ?? 'unknown'}`);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            style={errorStyles.iconCircle}
          >
            <Text style={errorStyles.iconText}>!</Text>
          </LinearGradient>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an unexpected error. Please try restarting.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={errorStyles.debug} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            style={errorStyles.button}
            onPress={this.handleRestart}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Restart app"
          >
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              style={errorStyles.buttonGradient}
            >
              <Text style={errorStyles.buttonText}>Restart</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.light.background,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.light.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.light.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debug: {
    fontSize: 12,
    color: colors.state.error,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Courier',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

/**
 * Tab Navigator — uses the DEFAULT built-in tab bar.
 * PaperProvider is at the app root, NOT per-screen.
 */
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map', tabBarAccessibilityLabel: 'Map tab' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search', tabBarAccessibilityLabel: 'Search tab' }} />
      <Tab.Screen name="Add" component={AddUtilityScreen} options={{ title: 'Add', tabBarAccessibilityLabel: 'Add utility tab' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Settings', tabBarAccessibilityLabel: 'Settings tab' }} />
    </Tab.Navigator>
  );
};

/**
 * Root Stack Navigator — wraps tabs and provides access to legal screens.
 * Conditionally renders Onboarding before MainTabs on first launch.
 */
const RootNavigator = () => {
  const { hasCompletedOnboarding } = useOnboardingStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding && (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ gestureEnabled: false }}
        />
      )}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </Stack.Navigator>
  );
};

// ── Deep Linking ────────────────────────────────────────────────────
// Maps urbanaid://map, urbanaid://search, etc. to navigation screens.
const linking: any = {
  prefixes: ['urbanaid://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Map: 'map',
          Search: 'search',
          Add: 'add',
          Profile: 'profile',
        },
      },
      PrivacyPolicy: 'privacy',
      TermsOfService: 'terms',
    },
  },
};

/**
 * Extract the active screen name from nested navigation state.
 */
function getActiveRouteName(state: NavigationState | undefined): string {
  if (!state) { return 'Unknown'; }
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

/**
 * Theme-aware App wrapper — PaperProvider at root so Portal renders above everything correctly
 */
const ThemedApp = () => {
  const { currentTheme } = useThemeStore();
  const routeNameRef = useRef<string>('Map');

  const onNavigationStateChange = useCallback((state: NavigationState | undefined) => {
    const currentRouteName = getActiveRouteName(state);
    if (currentRouteName !== routeNameRef.current) {
      logScreenView(currentRouteName);
      routeNameRef.current = currentRouteName;
    }
  }, []);

  return (
    <PaperProvider theme={currentTheme}>
      <NavigationContainer linking={linking} onStateChange={onNavigationStateChange}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

/**
 * Main App component
 */
const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeI18n();
        await initCrashReporting();
        await initAnalytics();
        trackSessionAndMaybePrompt();
        registerForPushNotifications();
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsReady(true);
        if (__DEV__) { console.log('UrbanAid V2 initialized...'); }
      } catch (error) {
        if (__DEV__) { console.error('Error initializing app:', error); }
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.loadingScreen}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              style={styles.loadingGradient}
            >
              <Text style={styles.loadingIcon}>🏙️</Text>
            </LinearGradient>
            <Text style={styles.loadingTitle}>UrbanAid</Text>
            <ActivityIndicator
              size="small"
              color={colors.gradient.start}
              style={styles.loadingSpinner}
            />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ThemedApp />
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  loadingIcon: {
    fontSize: 40,
  },
  loadingTitle: {
    fontSize: tokens.typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: colors.light.text.primary,
    marginBottom: tokens.spacing.lg,
  },
  loadingSpinner: {
    marginTop: tokens.spacing.md,
  },
});

export default App;
