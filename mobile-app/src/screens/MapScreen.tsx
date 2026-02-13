import React, { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Portal,
  Text,
  IconButton,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { useThemeStore, useCustomTheme } from '../stores/themeStore';
import { useLocationStore } from '../stores/locationStore';
import { useUtilityStore } from '../stores/utilityStore';
import { FilterModal } from '../components/FilterModal';
import { UtilityDetails } from '../components/UtilityDetails';
import { Utility } from '../types/utility';
import { UtilityMarker } from '../components/UtilityMarker';
import { getMarkerImage } from '../utils/markerImages';
import { requestLocationPermission } from '../utils/permissions';

import Svg, { Line, Circle, Path, Rect, G } from 'react-native-svg';
import { apiService } from '../services/apiService';
import { GradientButton, Chip } from '../components/ui';
import { colors } from '../theme/colors';
import { tokens } from '../theme/tokens';

// ── Welcome Back Overlay ─────────────────────────────────────────────
// Premium full-screen welcome shown on every cold launch (after onboarding).
// Tracks real loading progress across API fetch → mount → render phases.

interface WelcomeBackOverlayProps {
  visible: boolean;
  isDarkMode: boolean;
  progress: number;      // 0-1, computed by parent
  statusText: string;    // computed by parent
  fillDurationMs?: number;   // duration for main progress fill on UI thread
}

const WelcomeBackOverlay = React.memo(({ visible, isDarkMode, progress, statusText, fillDurationMs }: WelcomeBackOverlayProps) => {
  const animatedProgress = useSharedValue(0);
  const fadeOpacity = useSharedValue(1);
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [displayStatus, setDisplayStatus] = React.useState(statusText);

  // Update display status from parent, and schedule "Almost ready…" at 65% of fill
  React.useEffect(() => {
    setDisplayStatus(statusText);
    if (progress >= 1.0 && fillDurationMs) {
      const timer = setTimeout(() => setDisplayStatus('Almost ready…'), fillDurationMs * 0.65);
      return () => clearTimeout(timer);
    }
  }, [progress, statusText, fillDurationMs]);

  // Smooth progress bar animation — uses fillDurationMs for the main fill (UI thread)
  React.useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: progress >= 1.0 ? (fillDurationMs ?? 3000) : 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, fillDurationMs]);

  // Fade-out when loading completes, then unmount
  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
      fadeOpacity.value = 1;
    } else {
      fadeOpacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [visible]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(animatedProgress.value * 100, 100)}%`,
  }));

  const containerFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  if (!shouldRender) return null;

  return (
    <Modal visible={true} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[welcomeStyles.container, containerFadeStyle]}>
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={welcomeStyles.content}>
          {/* App branding */}
          <Text style={welcomeStyles.cityEmoji}>🏙️</Text>
          <Text style={welcomeStyles.welcomeLabel}>Welcome back to</Text>
          <Text style={welcomeStyles.appTitle}>UrbanAid</Text>

          {/* Progress bar */}
          <View style={welcomeStyles.progressTrack}>
            <Animated.View style={[welcomeStyles.progressFill, progressBarStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* Status text */}
          <Text style={welcomeStyles.statusText}>{displayStatus}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
});

const welcomeStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  cityEmoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg,
  },
  welcomeLabel: {
    ...tokens.typography.titleLarge,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  appTitle: {
    ...tokens.typography.displayMedium,
    color: '#FFFFFF',
    marginBottom: tokens.spacing.xxl,
  },
  progressTrack: {
    width: 280,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    // Glow effect
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  statusText: {
    ...tokens.typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: tokens.spacing.md,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
});

const UTILITY_FILTERS: { key: string; label: string; icon: string; categories?: string[] }[] = [
  { key: 'all', label: 'All', icon: '🏛️' },
  { key: 'restroom', label: 'Restrooms', icon: '🚻', categories: ['restroom'] },
  { key: 'water', label: 'Water', icon: '💧', categories: ['water_fountain', 'water', 'handwashing'] },
  { key: 'food', label: 'Food', icon: '🍽️', categories: ['free_food', 'food'] },
  { key: 'shelter', label: 'Shelter', icon: '🏠', categories: ['shelter', 'hurricane_shelter', 'warming_center', 'cooling_center'] },
  { key: 'health', label: 'Health', icon: '🏥', categories: ['health_center', 'community_health_center', 'migrant_health_center', 'homeless_health_center', 'public_housing_health_center', 'school_based_health_center', 'federally_qualified_health_center', 'clinic', 'medical'] },
  { key: 'wifi', label: 'WiFi', icon: '📶', categories: ['wifi', 'internet'] },
  { key: 'transit', label: 'Transit', icon: '🚌', categories: ['transit'] },
  { key: 'va', label: 'VA', icon: '🎖️', categories: ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office', 'va_cemetery'] },
  { key: 'usda', label: 'USDA', icon: '🌾', categories: ['usda_facility', 'usda_snap_office', 'usda_wic_office', 'usda_farm_service_center', 'usda_rural_development_office', 'usda_extension_office'] },
];

// SVG filter icons — clean vector icons matching the glassmorphic design
const FilterIcon: React.FC<{ filterKey: string; color: string }> = ({ filterKey, color }) => {
  const s = 14; // icon size inside chip
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (filterKey) {
    case 'all': // grid/dashboard
      return <Svg {...props}><Rect x="3" y="3" width="7" height="7" rx="1.5" /><Rect x="14" y="3" width="7" height="7" rx="1.5" /><Rect x="3" y="14" width="7" height="7" rx="1.5" /><Rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>;
    case 'restroom': // person figure
      return <Svg {...props}><Circle cx="12" cy="5" r="2.5" /><Path d="M12 10v6M9 22v-5l3-1 3 1v5M8 13h8" /></Svg>;
    case 'water': // droplet
      return <Svg {...props}><Path d="M12 2C12 2 5 10 5 14.5C5 18.64 8.13 22 12 22C15.87 22 19 18.64 19 14.5C19 10 12 2 12 2Z" /></Svg>;
    case 'food': // utensils
      return <Svg {...props}><Path d="M3 2v8c0 1.66 1.34 3 3 3h1v9" /><Path d="M7 2v4" /><Path d="M3 6h4" /><Path d="M17 2v20" /><Path d="M21 10c0-4.42-1.79-8-4-8v8" /></Svg>;
    case 'shelter': // house
      return <Svg {...props}><Path d="M3 12l9-9 9 9" /><Path d="M5 10v10h14V10" /><Rect x="9" y="14" width="6" height="6" /></Svg>;
    case 'health': // heart + pulse
      return <Svg {...props}><Path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" /></Svg>;
    case 'wifi': // wifi signal
      return <Svg {...props}><Path d="M2 8.5C5.5 4.5 10.5 3 12 3s6.5 1.5 10 5.5" /><Path d="M5.5 12C7.5 9.5 10 8.5 12 8.5s4.5 1 6.5 3.5" /><Path d="M9 15.5C10 14.5 11 14 12 14s2 .5 3 1.5" /><Circle cx="12" cy="19" r="1.5" fill={color} /></Svg>;
    case 'transit': // bus
      return <Svg {...props}><Rect x="4" y="3" width="16" height="14" rx="2" /><Path d="M4 10h16" /><Path d="M12 3v7" /><Circle cx="7.5" cy="20" r="1.5" fill={color} /><Circle cx="16.5" cy="20" r="1.5" fill={color} /><Path d="M4 17h16" /></Svg>;
    case 'va': // star (military)
      return <Svg {...props}><Path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 2.9 1.1-6.5L2.6 8.8l6.5-.9L12 2z" /></Svg>;
    case 'usda': // leaf
      return <Svg {...props}><Path d="M17 8C8 10 5.9 16.2 3.8 19.6" /><Path d="M20.5 4.5C16.5 3 6 5.5 3 19c2.5-2.5 6-4 10-4 3 0 5.5.5 7.5 1.5C21 12 20.5 4.5 20.5 4.5Z" /></Svg>;
    default:
      return null;
  }
};

// zIndex per category — spreads categories across layers so no single type
// always hides underneath others when markers overlap.
const CATEGORY_ZINDEX: Record<string, number> = {
  transit: 10,
  free_food: 20,
  food: 20,
  restroom: 30,
  health_center: 40,
  water_fountain: 50,
  water: 50,
  wifi: 60,
  internet: 60,
  va_facility: 70,
  shelter: 80,
  warming_center: 80,
  cooling_center: 80,
  hurricane_shelter: 80,
  usda_farm_service_center: 90,
  usda_snap_office: 90,
  usda_wic_office: 90,
  bench: 100,
  clinic: 40,
  medical: 40,
  library: 55,
  charging_station: 65,
  shower: 75,
  laundry: 75,
  clothing: 85,
  mental_health: 45,
  dental: 45,
  legal: 55,
  job_training: 65,
};

// Viewport culling — only render markers within 2.6x the visible map area.
// 0.8 = 80% screen buffer per edge, pre-loads more markers to prevent pop-in
// when Google Maps fires onRegionChangeComplete with adjusted bounds.
const VIEWPORT_BUFFER = 0.8;

// Pre-build Set lookup for O(1) category matching per filter chip
const FILTER_CATEGORY_MAP = new Map<string, Set<string>>(
  UTILITY_FILTERS
    .filter(f => f.categories)
    .map(f => [f.key, new Set(f.categories!)])
);

// Maps common everyday search terms → matching category/type values.
// A search term matches if the utility's category or type is in the set.
const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Water
  water:     ['water_fountain', 'water', 'handwashing'],
  drink:     ['water_fountain', 'water'],
  fountain:  ['water_fountain'],
  hydration: ['water_fountain', 'water'],
  // Restrooms
  restroom:  ['restroom'],
  bathroom:  ['restroom'],
  toilet:    ['restroom'],
  wc:        ['restroom'],
  lavatory:  ['restroom'],
  // Food
  food:      ['free_food', 'food'],
  eat:       ['free_food', 'food'],
  meal:      ['free_food', 'food'],
  hungry:    ['free_food', 'food'],
  grocery:   ['free_food', 'food'],
  snap:      ['usda_snap_office', 'free_food', 'food'],
  wic:       ['usda_wic_office'],
  // Shelter
  shelter:   ['shelter', 'hurricane_shelter', 'warming_center', 'cooling_center'],
  housing:   ['shelter'],
  sleep:     ['shelter'],
  bed:       ['shelter'],
  homeless:  ['shelter', 'homeless_health_center'],
  warm:      ['warming_center'],
  cool:      ['cooling_center'],
  // Health & Medical
  health:    ['health_center', 'community_health_center', 'migrant_health_center', 'homeless_health_center', 'public_housing_health_center', 'school_based_health_center', 'federally_qualified_health_center', 'clinic', 'medical'],
  doctor:    ['health_center', 'community_health_center', 'clinic', 'medical'],
  clinic:    ['clinic', 'medical', 'health_center', 'community_health_center'],
  medical:   ['medical', 'clinic', 'health_center', 'community_health_center', 'va_medical_center'],
  hospital:  ['medical', 'clinic', 'health_center'],
  dental:    ['dental'],
  dentist:   ['dental'],
  teeth:     ['dental'],
  eye:       ['eye_care'],
  vision:    ['eye_care'],
  glasses:   ['eye_care'],
  // Mental Health & Crisis
  mental:    ['mental_health', 'suicide_prevention'],
  therapy:   ['mental_health'],
  counseling:['mental_health'],
  crisis:    ['suicide_prevention', 'mental_health'],
  suicide:   ['suicide_prevention'],
  addiction: ['addiction_services'],
  rehab:     ['addiction_services'],
  drug:      ['addiction_services', 'needle_exchange', 'safe_injection'],
  sober:     ['addiction_services'],
  domestic:  ['domestic_violence'],
  abuse:     ['domestic_violence'],
  // VA / Veterans
  va:        ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office', 'va_cemetery'],
  veteran:   ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office'],
  vet:       ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center'],
  military:  ['va_facility', 'va_medical_center'],
  // WiFi & Internet
  wifi:      ['wifi', 'internet'],
  internet:  ['wifi', 'internet'],
  online:    ['wifi', 'internet'],
  // Transit
  transit:   ['transit'],
  bus:       ['transit'],
  train:     ['transit'],
  ride:      ['transit'],
  transport: ['transit'],
  // Hygiene
  shower:    ['shower'],
  laundry:   ['laundry'],
  wash:      ['laundry', 'handwashing', 'shower'],
  clean:     ['laundry', 'shower', 'handwashing'],
  haircut:   ['haircut'],
  barber:    ['haircut'],
  // Charging & Power
  charging:  ['charging'],
  charge:    ['charging'],
  power:     ['charging'],
  phone:     ['charging'],
  battery:   ['charging'],
  // Library
  library:   ['library'],
  book:      ['library'],
  books:     ['library'],
  // Other services
  legal:     ['legal'],
  lawyer:    ['legal'],
  law:       ['legal'],
  job:       ['job_training'],
  work:      ['job_training'],
  employment:['job_training'],
  training:  ['job_training'],
  tax:       ['tax_help'],
  taxes:     ['tax_help'],
  irs:       ['tax_help'],
  social:    ['social_services'],
  baby:      ['baby_needs'],
  infant:    ['baby_needs'],
  diaper:    ['baby_needs'],
  pet:       ['pet_services'],
  dog:       ['pet_services'],
  cat:       ['pet_services'],
  animal:    ['pet_services'],
  needle:    ['needle_exchange'],
  syringe:   ['needle_exchange', 'safe_injection'],
  clothing:  ['clothing'],
  clothes:   ['clothing'],
  jacket:    ['clothing'],
  coat:      ['clothing'],
  bench:     ['bench'],
  sit:       ['bench'],
  seat:      ['bench'],
  emergency: ['disaster_relief', 'hurricane_shelter', 'warming_center', 'cooling_center'],
  disaster:  ['disaster_relief'],
  usda:      ['usda_facility', 'usda_rural_development_office', 'usda_snap_office', 'usda_farm_service_center', 'usda_extension_office', 'usda_wic_office'],
  farm:      ['usda_farm_service_center'],
};

/**
 * Main map screen component
 * Shows Google Maps with utility markers and search functionality
 * Redesigned with glassmorphic UI and bottom sheet
 */
const MapScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { currentTheme, isDarkMode } = useThemeStore();
  const customTheme = useCustomTheme();
  const { currentLocation, getCurrentLocation, hasLocationPermission, setLocationPermission } = useLocationStore();
  const { utilities, isLoading, setLoading, setUtilities } = useUtilityStore();

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const mapReadyRef = useRef(false);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  // Deferred filter value — chips highlight immediately via activeFilter,
  // while the heavy marker re-render uses this deferred value so the UI
  // stays responsive during the first filter tap (~3400 marker unmounts).
  const deferredFilter = useDeferredValue(activeFilter);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Viewport culling: track the visible map region so we only render nearby markers.
  // Initialized from currentLocation so culling is active from the first frame.
  const [mapRegion, setMapRegion] = useState<Region | null>(
    currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    } : null
  );
  const initialFetchDone = useRef(false);
  const fetchInProgress = useRef(false);

  // Refs for values needed inside useFocusEffect without triggering re-fires.
  const currentLocationRef = useRef(currentLocation);
  currentLocationRef.current = currentLocation;
  const utilitiesLengthRef = useRef(utilities.length);
  utilitiesLengthRef.current = utilities.length;

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['35%', '65%', '90%'], []);

  // Animation values
  const fabRotation = useSharedValue(0);

  // Loading overlay state — the useEffect that drives it lives below,
  // after filteredUtilities and mountedCount are declared.
  const [renderComplete, setRenderComplete] = useState(false);

  useEffect(() => {
    initializeMap();
  }, [hasLocationPermission]);

  // Fetch ALL utilities statewide — single call, loads every pin at once.
  const fetchAllUtilities = useCallback(async (loc?: { latitude: number; longitude: number }) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setLoading(true);
    try {
      const results = await apiService.getAllUtilities();
      setUtilities(results || []);
      console.log(`Loaded ${results?.length || 0} utilities statewide`);
    } catch (e: any) {
      console.warn('Statewide fetch failed, falling back to nearby:', e);
      const location = loc || currentLocationRef.current;
      if (location) {
        try {
          const results = await apiService.getNearbyUtilities({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 200.0,
            limit: 5000,
          } as any);
          setUtilities(results || []);
        } catch (e2: any) {
          console.warn('Backend fetch failed:', e2);
        }
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
    }
  }, [setUtilities, setLoading]);

  // Initial fetch — fires ONCE on mount, loads ALL WA utilities
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchAllUtilities();
  }, [fetchAllUtilities]);

  // Retry when location becomes available if initial fetch loaded zero utilities.
  // Catches the case where the first fetch failed because location wasn't ready.
  // Only depends on currentLocation so it fires once when location first arrives.
  // Uses utilitiesLengthRef to avoid re-triggering on every fetch completion.
  useEffect(() => {
    if (currentLocation && utilitiesLengthRef.current === 0 && initialFetchDone.current) {
      fetchAllUtilities(currentLocation);
    }
  }, [currentLocation, fetchAllUtilities]);

  // Re-center map + re-fetch utilities every time the Map tab gains focus.
  useFocusEffect(
    useCallback(() => {
      const loc = currentLocationRef.current;
      if (loc && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
      // Re-fetch so new utilities (added via AddUtilityScreen) appear.
      if (initialFetchDone.current) {
        fetchAllUtilities();
      }

      // Delayed retry — if fetchInProgress blocked the call above and we still
      // have 0 utilities after 3s, try once more.
      const retryTimer = setTimeout(() => {
        if (utilitiesLengthRef.current === 0 && !fetchInProgress.current) {
          fetchAllUtilities();
        }
      }, 3000);

      return () => clearTimeout(retryTimer);
    }, [fetchAllUtilities])
  );

  // Center map on user location once it becomes available for the first time.
  // initializeMap also does this, but if the map isn't ready when initializeMap
  // runs, this effect catches it. Only fires once (hasInitialCentered ref guard).
  const hasInitialCentered = useRef(false);
  useEffect(() => {
    if (!hasInitialCentered.current && currentLocation && mapRef.current && mapReady) {
      hasInitialCentered.current = true;
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [currentLocation, mapReady]);


  const initializeMap = async () => {
    let hasPermission = hasLocationPermission;

    // Request permission if not already granted
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      setLocationPermission(granted);
      hasPermission = granted;

      if (!granted) {
        return; // User denied permission
      }
    }

    try {
      const location = await getCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    const query = searchQuery.trim();
    setCommittedSearch(query);

    if (!query) return;

    // Pre-compute results for map animation (same logic as filteredUtilities)
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    const synonymCategories = new Set<string>();
    for (const word of words) {
      const matches = SEARCH_SYNONYMS[word];
      if (matches) matches.forEach((c) => synonymCategories.add(c));
    }
    const results = utilities.filter((u) => {
      if (synonymCategories.size > 0) {
        if (synonymCategories.has(u.category) || (u.type && synonymCategories.has(u.type))) {
          return true;
        }
      }
      const fields = [u.name, u.category, u.type, u.address, u.description];
      return fields.some((f) => f?.toLowerCase().includes(lowerQuery));
    });

    // If exactly 1 result, auto-select and open bottom sheet
    if (results.length === 1) {
      setSelectedUtility(results[0]);
    }

    // Animate map to fit all matching results
    if (results.length > 0 && mapRef.current) {
      const coords = results.map((u) => ({
        latitude: u.latitude,
        longitude: u.longitude,
      }));
      if (coords.length === 1) {
        mapRef.current.animateToRegion({
          latitude: coords[0].latitude,
          longitude: coords[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      } else {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    }
  }, [searchQuery, utilities]);

  const handleMarkerPress = useCallback((utility: Utility) => {
    setSelectedUtility(utility);
    // Imperatively open the sheet after setting the utility
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleMyLocationPress = useCallback(async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        t('location_permission_required'),
        t('location_permission_message')
      );
      return;
    }

    // Animate the FAB
    fabRotation.value = withSpring(fabRotation.value + 360, {
      damping: 15,
      stiffness: 100,
    });

    try {
      const location = await getCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('error'), 'Failed to get current location');
    }
  }, [hasLocationPermission, getCurrentLocation, t, fabRotation]);

  const handleFilterPress = useCallback((filterKey: string) => {
    setActiveFilter(filterKey);
  }, []);

  // Update viewport bounds after every pan/zoom/animation completes.
  // No isGesture filter — we want culling to update for both user gestures
  // and programmatic animations (e.g., animateToRegion on search/tab focus).
  const firstRegionFiredRef = useRef(false);
  const handleRegionChangeComplete = useCallback((region: Region) => {
    // First region change: apply immediately (no debounce) so render set
    // targets the real viewport ASAP during initial load.
    if (!firstRegionFiredRef.current) {
      firstRegionFiredRef.current = true;
      setMapRegion(region);
      return;
    }
    if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    regionDebounceRef.current = setTimeout(() => {
      setMapRegion(region);
    }, 300);
  }, []);

  const handleBottomSheetClose = useCallback(() => {
    // BottomSheet stays mounted, just clear the selected utility
    setSelectedUtility(null);
  }, []);

  // Filter utilities based on committed search AND active category filter.
  // Filters work upstream of clustering — only matching utilities are indexed.
  const filteredUtilities = useMemo(() => {
    let result = utilities;

    const query = committedSearch.toLowerCase();
    if (query) {
      const words = query.split(/\s+/);
      const synonymCategories = new Set<string>();
      for (const word of words) {
        const matches = SEARCH_SYNONYMS[word];
        if (matches) matches.forEach((c) => synonymCategories.add(c));
      }

      result = result.filter((u) => {
        if (synonymCategories.size > 0) {
          if (synonymCategories.has(u.category) || (u.type && synonymCategories.has(u.type))) {
            return true;
          }
        }
        const fields = [u.name, u.category, u.type, u.address, u.description];
        return fields.some((f) => f?.toLowerCase().includes(query));
      });
    }

    if (deferredFilter !== 'all') {
      const matchSet = FILTER_CATEGORY_MAP.get(deferredFilter);
      if (matchSet) {
        result = result.filter(u =>
          matchSet.has(u.category?.toLowerCase()) ||
          (u.type && matchSet.has(u.type.toLowerCase()))
        );
      }
    }

    return result;
  }, [utilities, deferredFilter, committedSearch]);

  // ── Progressive mount ───────────────────────────────────────────────
  // Mount ALL markers once in batches of 500 every 50ms via setTimeout chain.
  // Filter/search changes use return null (unmount) — no progressive batching.
  const MOUNT_BATCH = 5000;       // mount all ~3,670 in a single tick (just a JS array slice)
  const RENDER_BATCH = 300;       // stable render set adds 300 native markers per batch (no churn)
  const INITIAL_RENDER_BATCH = 4000; // during welcome screen — load all viewport markers in one shot
  const MAX_RENDERED = 4000;      // above total utility count — effectively unlimited
  const MOUNT_INTERVAL = 50;
  const [mountedCount, setMountedCount] = useState(0);

  // Reset only when utilities itself changes (re-fetch from API)
  const prevUtilitiesLenRef = useRef(utilities.length);
  useEffect(() => {
    if (utilities.length !== prevUtilitiesLenRef.current) {
      prevUtilitiesLenRef.current = utilities.length;
      setMountedCount(0);
    }
  }, [utilities.length]);

  // setTimeout chain: mount MOUNT_BATCH per tick
  useEffect(() => {
    if (mountedCount >= utilities.length) return;
    const timer = setTimeout(() => {
      setMountedCount(prev => Math.min(prev + MOUNT_BATCH, utilities.length));
    }, MOUNT_INTERVAL);
    return () => clearTimeout(timer);
  }, [mountedCount, utilities.length]);

  const visibleUtilities = useMemo(
    () => utilities.slice(0, mountedCount),
    [utilities, mountedCount]
  );

  // O(1) per-marker filter check — null means everything matches.
  // Uses deferredFilter so this recomputes on the deferred render pass,
  // keeping the chip highlight instant while markers update asynchronously.
  const matchingFilterIds = useMemo(() => {
    if (deferredFilter === 'all' && !committedSearch) return null;
    return new Set(filteredUtilities.map(u => u.id));
  }, [filteredUtilities, deferredFilter, committedSearch]);

  // ── Viewport culling ──────────────────────────────────────────────
  // Compute the buffered bounding box from the current map region.
  // At city zoom (~0.05° delta), this covers ~0.1° total — plenty to
  // prevent visible pop-in during normal panning.
  const viewportBounds = useMemo(() => {
    if (!mapRegion) return null;
    const latHalf = mapRegion.latitudeDelta * (0.5 + VIEWPORT_BUFFER);
    const lngHalf = mapRegion.longitudeDelta * (0.5 + VIEWPORT_BUFFER);
    return {
      minLat: mapRegion.latitude - latHalf,
      maxLat: mapRegion.latitude + latHalf,
      minLng: mapRegion.longitude - lngHalf,
      maxLng: mapRegion.longitude + lngHalf,
    };
  }, [mapRegion]);

  // Final marker list — viewport culling + category/search filter in one pass.
  // At city zoom this reduces ~3,670 → ~300 markers, making filter changes instant.
  const markersToRender = useMemo(() => {
    let markers = visibleUtilities;

    // Viewport culling — skip if no region yet (initial load before map fires)
    if (viewportBounds) {
      markers = markers.filter(u =>
        u.latitude >= viewportBounds.minLat &&
        u.latitude <= viewportBounds.maxLat &&
        u.longitude >= viewportBounds.minLng &&
        u.longitude <= viewportBounds.maxLng
      );
    }

    // Category/search filter — null means everything matches ("All" with no search)
    if (matchingFilterIds !== null) {
      markers = markers.filter(u => matchingFilterIds.has(u.id));
    }

    return markers;
  }, [visibleUtilities, viewportBounds, matchingFilterIds]);

  // ── Stable render set ─────────────────────────────────────────────
  // Tracks which marker IDs are in the React tree via a ref.
  // On viewport change: existing markers STAY mounted (no churn);
  // only markers that left the viewport are pruned, and new markers
  // are added in batches. This eliminates the simultaneous
  // unmount+mount bursts that crash the native Google Maps layer.
  const renderedIdsRef = useRef<Set<number | string>>(new Set());
  const [renderTick, setRenderTick] = useState(0);

  // On viewport/filter change: prune stale markers, add first batch of new ones
  useEffect(() => {
    const validIds = new Set(markersToRender.map(m => m.id));
    let changed = false;

    // Prune markers that left the viewport
    for (const id of renderedIdsRef.current) {
      if (!validIds.has(id)) {
        renderedIdsRef.current.delete(id);
        changed = true;
      }
    }

    // Add new markers — during initial load, dump ALL viewport markers in one shot;
    // after initial load, use conservative batching for smooth pan/zoom.
    const batchSize = initialLoadCompleteRef.current ? RENDER_BATCH : INITIAL_RENDER_BATCH;
    let added = 0;
    for (const m of markersToRender) {
      if (renderedIdsRef.current.size >= MAX_RENDERED) break;
      if (added >= batchSize) break;
      if (!renderedIdsRef.current.has(m.id)) {
        renderedIdsRef.current.add(m.id);
        added++;
        changed = true;
      }
    }

    if (changed) setRenderTick(t => t + 1);
  }, [markersToRender]);

  // Growth timer — continue adding new markers in batches
  useEffect(() => {
    const target = Math.min(markersToRender.length, MAX_RENDERED);
    if (renderedIdsRef.current.size >= target) return;

    const timer = setTimeout(() => {
      const batchSize = initialLoadCompleteRef.current ? RENDER_BATCH : INITIAL_RENDER_BATCH;
      let added = 0;
      for (const m of markersToRender) {
        if (renderedIdsRef.current.size >= MAX_RENDERED) break;
        if (added >= batchSize) break;
        if (!renderedIdsRef.current.has(m.id)) {
          renderedIdsRef.current.add(m.id);
          added++;
        }
      }
      if (added > 0) setRenderTick(t => t + 1);
    }, MOUNT_INTERVAL);

    return () => clearTimeout(timer);
  }, [renderTick, markersToRender]);

  // Stable final markers — filters by the rendered set.
  // On zoom-out: existing markers stay, new ones appear progressively.
  // On zoom-in: out-of-viewport markers are excluded immediately.
  const finalMarkers = useMemo(
    () => markersToRender.filter(m => renderedIdsRef.current.has(m.id)),
    [markersToRender, renderTick]
  );

  // Loading overlay — shown during initial data fetch + progressive mount only.
  const initialLoadCompleteRef = useRef(false);

  // ── Time-based welcome screen gate ────────────────────────────────
  // Ensures the welcome screen stays visible for MIN_DISPLAY_MS after
  // API data arrives, giving the progress bar time to fill smoothly.
  const dataReadyTimeRef = useRef<number | null>(null);
  const MIN_DISPLAY_MS = 5000;

  // Record when API data arrives
  useEffect(() => {
    if (!isLoading && utilities.length > 0 && dataReadyTimeRef.current === null) {
      dataReadyTimeRef.current = Date.now();
    }
  }, [isLoading, utilities.length]);

  useEffect(() => {
    if (isLoading) { setRenderComplete(false); return; }
    if (mountedCount < utilities.length) { setRenderComplete(false); return; }
    // Wait for the stable render set to finish adding all visible markers
    const target = Math.min(markersToRender.length, MAX_RENDERED);
    if (target > 0 && renderedIdsRef.current.size < target) { setRenderComplete(false); return; }
    // Enforce minimum display time so pins fully load behind the welcome screen
    const elapsed = dataReadyTimeRef.current ? Date.now() - dataReadyTimeRef.current : 0;
    const remaining = Math.max(1500, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => setRenderComplete(true), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, mountedCount, utilities.length, markersToRender.length, renderTick]);

  // Mark initial load as complete so tab switches don't re-show the overlay.
  useEffect(() => {
    if (!isLoading && renderComplete) {
      initialLoadCompleteRef.current = true;
    }
  }, [isLoading, renderComplete]);

  // Two-phase progress: 10% during API fetch → 100% when data ready (overlay animates the fill)
  const loadingProgress = useMemo(() => {
    if (isLoading) return 0.1;  // API fetch phase
    return 1.0;                 // Data ready — overlay fills over fillDurationMs
  }, [isLoading]);

  const loadingStatusText = isLoading
    ? 'Fetching resources…'
    : 'Loading map pins…';

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    };
  }, []);

  // Show overlay on cold launch only — not on tab re-focus.
  const showLoadingOverlay = !initialLoadCompleteRef.current && (isLoading || !renderComplete);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Permission screen
  if (!hasLocationPermission) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          style={styles.permissionGradient}
        >
          <View style={[styles.permissionContent, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Text style={styles.permissionIcon}>📍</Text>
            <Text style={styles.permissionTitle}>Enable Location</Text>
            <Text style={styles.permissionText}>
              {t('location_permission_message')}
            </Text>
            <GradientButton
              title="Enable Location"
              onPress={initializeMap}
              size="lg"
              style={{ marginTop: tokens.spacing.lg }}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : undefined}
          onMapReady={() => {
            mapReadyRef.current = true;
            setMapReady(true);
          }}
          onRegionChangeComplete={handleRegionChangeComplete}
      >
          {finalMarkers.map((utility) => {
            const utilityType = utility.type || utility.category || 'water_fountain';
            const catZIndex = CATEGORY_ZINDEX[utility.category] || 5;
            return (
              <Marker
                key={utility.id}
                coordinate={{ latitude: utility.latitude, longitude: utility.longitude }}
                onPress={() => handleMarkerPress(utility)}
                tracksViewChanges={false}
                zIndex={catZIndex}
                anchor={{ x: 0.5, y: 0.5 }}
                image={getMarkerImage(utilityType)}
              />
            );
          })}
          {selectedUtility && (
            <Marker
              key={`selected-${selectedUtility.id}`}
              coordinate={{
                latitude: selectedUtility.latitude,
                longitude: selectedUtility.longitude,
              }}
              onPress={() => handleMarkerPress(selectedUtility)}
              tracksViewChanges={false}
              zIndex={1000}
            >
              <UtilityMarker utility={selectedUtility} size="large" isSelected />
            </Marker>
          )}
      </MapView>

      {/* Search bar overlay */}
      <View
        pointerEvents="box-none"
        style={[styles.searchWrapper, { paddingTop: insets.top + tokens.spacing.sm }]}
      >
        <View style={styles.searchContainer}>
          <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={styles.searchBlur} />
          <View style={styles.searchInner}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={styles.searchIcon}>
              <Circle cx="10.5" cy="10.5" r="7" />
              <Line x1="15.5" y1="15.5" x2="21" y2="21" />
            </Svg>
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
              placeholder={t('search.placeholder') || 'Search for utilities...'}
              placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearchQuery(''); setCommittedSearch(''); }}
                style={{ padding: 4, marginRight: 4 }}
              >
                <Text style={{ fontSize: 16, color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                style={styles.filterButtonGradient}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round">
                  {/* Three horizontal lines with offset knobs */}
                  <Line x1="4" y1="6" x2="20" y2="6" />
                  <Circle cx="9" cy="6" r="2.5" fill="#FFFFFF" />
                  <Line x1="4" y1="12" x2="20" y2="12" />
                  <Circle cx="16" cy="12" r="2.5" fill="#FFFFFF" />
                  <Line x1="4" y1="18" x2="20" y2="18" />
                  <Circle cx="11" cy="18" r="2.5" fill="#FFFFFF" />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        {/* Filter chips — horizontal scroll for 15 grouped categories */}
        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScrollContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {UTILITY_FILTERS.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                icon={<FilterIcon filterKey={filter.key} color={activeFilter === filter.key ? '#FFFFFF' : (isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)')} />}
                selected={activeFilter === filter.key}
                onPress={() => handleFilterPress(filter.key)}
                style={styles.filterChip}
              />
            ))}
          </ScrollView>
        )}
        </View>
      </View>

      {/* Welcome back overlay — shown on cold launch with progress bar */}
      <WelcomeBackOverlay
        visible={showLoadingOverlay}
        isDarkMode={isDarkMode}
        progress={loadingProgress}
        statusText={loadingStatusText}
        fillDurationMs={MIN_DISPLAY_MS}
      />

      {/* FAB — My Location button */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fabContainer,
          { bottom: insets.bottom + 100 },
          fabAnimatedStyle,
        ]}
      >
        <TouchableOpacity onPress={handleMyLocationPress} activeOpacity={0.8}>
          <View style={styles.fab}>
            <BlurView intensity={60} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[`${colors.gradient.start}CC`, `${colors.gradient.end}CC`]}
              style={StyleSheet.absoluteFill}
            />
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="4" />
              <Line x1="12" y1="2" x2="12" y2="6" />
              <Line x1="12" y1="18" x2="12" y2="22" />
              <Line x1="2" y1="12" x2="6" y2="12" />
              <Line x1="18" y1="12" x2="22" y2="12" />
            </Svg>
          </View>
        </TouchableOpacity>
      </Animated.View>


      {/* BottomSheet — Always mounted for instant response, controlled imperatively via ref.
           Portal hoists it above the Tab.Navigator so it renders on top of GlassTabBar */}
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={handleBottomSheetClose}
          backdropComponent={selectedUtility ? renderBackdrop : undefined}
          backgroundStyle={[
            styles.bottomSheetBackground,
            { backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface },
          ]}
          handleIndicatorStyle={[
            styles.bottomSheetHandle,
            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
          ]}
        >
          <BottomSheetScrollView
            style={styles.bottomSheetContent}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          >
            {selectedUtility && (
              <UtilityDetails
                utility={selectedUtility}
                onClose={() => bottomSheetRef.current?.close()}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    overflow: 'hidden',
  },

  // Search styles
  searchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.md,
    zIndex: 10,
  },
  searchContainer: {
    borderRadius: tokens.radius.searchBar,
    overflow: 'hidden',
    ...tokens.shadows.glass,
  },
  searchBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: tokens.radius.searchBar,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: tokens.typography.bodyLarge.fontWeight,
    letterSpacing: tokens.typography.bodyLarge.letterSpacing,
    paddingVertical: tokens.spacing.md,
  },
  filterButton: {
    marginLeft: tokens.spacing.sm,
  },
  filterButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 16,
  },

  // Filter chips — horizontal scrollable row
  filtersScrollContainer: {
    marginTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: tokens.spacing.xs,
  },
  filterChip: {
    marginRight: tokens.spacing.xs,
  },

  // FAB styles
  fabContainer: {
    position: 'absolute',
    right: tokens.spacing.md,
    zIndex: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: tokens.radius.fab,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...tokens.shadows.glass,
  },

  // Permission screen
  permissionGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg,
  },
  permissionTitle: {
    ...tokens.typography.headlineMedium,
    color: '#FFFFFF',
    marginBottom: tokens.spacing.sm,
  },
  permissionText: {
    ...tokens.typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Bottom Sheet
  bottomSheetBackground: {
    borderTopLeftRadius: tokens.radius.bottomSheet,
    borderTopRightRadius: tokens.radius.bottomSheet,
    ...tokens.shadows.xl,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: tokens.spacing.sm,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
  },
});

export default MapScreen;
