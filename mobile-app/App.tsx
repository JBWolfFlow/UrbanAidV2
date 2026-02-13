import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

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

import MapView from 'react-native-maps';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

const MinimalMapTest = () => (
  <View style={{ flex: 1 }}>
    <MapView style={{ flex: 1 }} />
  </View>
);

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
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Add" component={AddUtilityScreen} options={{ title: 'Add' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Settings' }} />
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

/**
 * Theme-aware App wrapper — PaperProvider at root so Portal renders above everything correctly
 */
const ThemedApp = () => {
  const { currentTheme } = useThemeStore();

  return (
    <PaperProvider theme={currentTheme}>
      <NavigationContainer>
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
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsReady(true);
        console.log('UrbanAid V2 initialized...');
      } catch (error) {
        console.error('Error initializing app:', error);
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
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemedApp />
        </SafeAreaProvider>
      </QueryClientProvider>
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
