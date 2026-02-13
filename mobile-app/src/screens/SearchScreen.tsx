import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import {
  Portal,
  Modal,
  Text,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

import { useThemeStore, useCustomTheme } from '../stores/themeStore';
import { useUtilityStore } from '../stores/utilityStore';
import { useLocationStore } from '../stores/locationStore';
import { Utility, UtilityType } from '../types/utility';
import { calculateDistance } from '../utils/location';
import { getUtilityTypeName } from '../utils/utilityHelpers';
import { useTranslation } from '../services/i18n';
import { GlassCard, GradientButton, Chip, SkeletonListItem } from '../components/ui';
import { colors, getUtilityColor } from '../theme/colors';
import { tokens } from '../theme/tokens';

// ─── SVG Icons ─────────────────────────────────────────────────────────
const SearchIcon: React.FC<{ size?: number; color: string }> = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="7" />
    <Line x1="16.5" y1="16.5" x2="21" y2="21" />
  </Svg>
);

const ClearIcon: React.FC<{ size?: number; color: string }> = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const LocationPinIcon: React.FC<{ size?: number; color: string }> = ({ size = 13, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <Circle cx="12" cy="9" r="2.5" />
  </Svg>
);

// Category-specific SVG icons (matches map screen FilterIcon)
const CategoryIcon: React.FC<{ category: string; color: string; size?: number }> = ({ category, color, size = 20 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 2 as number, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const lower = category.toLowerCase();

  if (lower.includes('water') || lower === 'handwashing')
    return <Svg {...p}><Path d="M12 2C12 2 5 10 5 14.5C5 18.64 8.13 22 12 22C15.87 22 19 18.64 19 14.5C19 10 12 2 12 2Z" /></Svg>;
  if (lower === 'restroom')
    return <Svg {...p}><Circle cx="12" cy="5" r="2.5" /><Path d="M12 10v6M9 22v-5l3-1 3 1v5M8 13h8" /></Svg>;
  if (lower.includes('charging'))
    return <Svg {...p}><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></Svg>;
  if (lower === 'wifi' || lower === 'internet')
    return <Svg {...p}><Path d="M2 8.5C5.5 4.5 10.5 3 12 3s6.5 1.5 10 5.5" /><Path d="M5.5 12C7.5 9.5 10 8.5 12 8.5s4.5 1 6.5 3.5" /><Path d="M9 15.5C10 14.5 11 14 12 14s2 .5 3 1.5" /><Circle cx="12" cy="19" r="1.5" fill={color} /></Svg>;
  if (lower === 'food' || lower === 'free_food')
    return <Svg {...p}><Path d="M3 2v8c0 1.66 1.34 3 3 3h1v9" /><Path d="M7 2v4" /><Path d="M3 6h4" /><Path d="M17 2v20" /><Path d="M21 10c0-4.42-1.79-8-4-8v8" /></Svg>;
  if (lower.includes('shelter') || lower.includes('warming') || lower.includes('cooling') || lower.includes('hurricane'))
    return <Svg {...p}><Path d="M3 12l9-9 9 9" /><Path d="M5 10v10h14V10" /><Rect x="9" y="14" width="6" height="6" /></Svg>;
  if (lower.includes('health') || lower === 'clinic' || lower === 'medical')
    return <Svg {...p}><Path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" /></Svg>;
  if (lower === 'bench')
    return <Svg {...p}><Path d="M4 12h16M4 8h16" /><Path d="M6 12v4M18 12v4M6 8V6M18 8V6" /></Svg>;
  if (lower === 'library')
    return <Svg {...p}><Path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" /></Svg>;
  if (lower === 'transit')
    return <Svg {...p}><Rect x="4" y="3" width="16" height="14" rx="2" /><Path d="M4 10h16" /><Path d="M12 3v7" /><Circle cx="7.5" cy="20" r="1.5" fill={color} /><Circle cx="16.5" cy="20" r="1.5" fill={color} /><Path d="M4 17h16" /></Svg>;
  if (lower.startsWith('va_'))
    return <Svg {...p}><Path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 2.9 1.1-6.5L2.6 8.8l6.5-.9L12 2z" /></Svg>;
  if (lower.startsWith('usda'))
    return <Svg {...p}><Path d="M17 8C8 10 5.9 16.2 3.8 19.6" /><Path d="M20.5 4.5C16.5 3 6 5.5 3 19c2.5-2.5 6-4 10-4 3 0 5.5.5 7.5 1.5C21 12 20.5 4.5 20.5 4.5Z" /></Svg>;
  if (lower === 'mental_health')
    return <Svg {...p}><Path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" /></Svg>;
  // default: generic circle
  return <Svg {...p}><Circle cx="12" cy="12" r="9" /></Svg>;
};

// Filter chip SVG icons (smaller, for chips in header)
const FilterChipIcon: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const s = 14;
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (type) {
    case 'all':
      return <Svg {...p}><Rect x="3" y="3" width="7" height="7" rx="1.5" /><Rect x="14" y="3" width="7" height="7" rx="1.5" /><Rect x="3" y="14" width="7" height="7" rx="1.5" /><Rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>;
    case 'restroom':
      return <Svg {...p}><Circle cx="12" cy="5" r="2.5" /><Path d="M12 10v6M9 22v-5l3-1 3 1v5M8 13h8" /></Svg>;
    case 'water_fountain':
      return <Svg {...p}><Path d="M12 2C12 2 5 10 5 14.5C5 18.64 8.13 22 12 22C15.87 22 19 18.64 19 14.5C19 10 12 2 12 2Z" /></Svg>;
    case 'food':
      return <Svg {...p}><Path d="M3 2v8c0 1.66 1.34 3 3 3h1v9" /><Path d="M7 2v4" /><Path d="M3 6h4" /><Path d="M17 2v20" /><Path d="M21 10c0-4.42-1.79-8-4-8v8" /></Svg>;
    case 'shelter':
      return <Svg {...p}><Path d="M3 12l9-9 9 9" /><Path d="M5 10v10h14V10" /><Rect x="9" y="14" width="6" height="6" /></Svg>;
    case 'health_center':
      return <Svg {...p}><Path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" /></Svg>;
    case 'wifi':
      return <Svg {...p}><Path d="M2 8.5C5.5 4.5 10.5 3 12 3s6.5 1.5 10 5.5" /><Path d="M5.5 12C7.5 9.5 10 8.5 12 8.5s4.5 1 6.5 3.5" /><Path d="M9 15.5C10 14.5 11 14 12 14s2 .5 3 1.5" /><Circle cx="12" cy="19" r="1.5" fill={color} /></Svg>;
    case 'transit':
      return <Svg {...p}><Rect x="4" y="3" width="16" height="14" rx="2" /><Path d="M4 10h16" /><Path d="M12 3v7" /><Circle cx="7.5" cy="20" r="1.5" fill={color} /><Circle cx="16.5" cy="20" r="1.5" fill={color} /><Path d="M4 17h16" /></Svg>;
    case 'va_facility':
      return <Svg {...p}><Path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 2.9 1.1-6.5L2.6 8.8l6.5-.9L12 2z" /></Svg>;
    case 'usda_facility':
      return <Svg {...p}><Path d="M17 8C8 10 5.9 16.2 3.8 19.6" /><Path d="M20.5 4.5C16.5 3 6 5.5 3 19c2.5-2.5 6-4 10-4 3 0 5.5.5 7.5 1.5C21 12 20.5 4.5 20.5 4.5Z" /></Svg>;
    default:
      return <Svg {...p}><Circle cx="12" cy="12" r="9" /></Svg>;
  }
};

const UTILITY_TYPES: { key: string; label: string; categories: string[] }[] = [
  { key: 'all', label: 'All', categories: [] },
  { key: 'restroom', label: 'Restrooms', categories: ['restroom'] },
  { key: 'water_fountain', label: 'Water', categories: ['water_fountain', 'water', 'handwashing'] },
  { key: 'food', label: 'Food', categories: ['free_food', 'food'] },
  { key: 'shelter', label: 'Shelter', categories: ['shelter', 'hurricane_shelter', 'warming_center', 'cooling_center'] },
  { key: 'health_center', label: 'Health', categories: ['health_center', 'community_health_center', 'migrant_health_center', 'homeless_health_center', 'public_housing_health_center', 'school_based_health_center', 'federally_qualified_health_center', 'clinic', 'medical'] },
  { key: 'wifi', label: 'WiFi', categories: ['wifi', 'internet'] },
  { key: 'transit', label: 'Transit', categories: ['transit'] },
  { key: 'va_facility', label: 'VA', categories: ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office', 'va_cemetery'] },
  { key: 'usda_facility', label: 'USDA', categories: ['usda_facility', 'usda_snap_office', 'usda_wic_office', 'usda_farm_service_center', 'usda_rural_development_office', 'usda_extension_office'] },
];

// Synonym map — same as MapScreen for consistent search behavior
const SEARCH_SYNONYMS: Record<string, string[]> = {
  water: ['water_fountain', 'water', 'handwashing'], drink: ['water_fountain', 'water'], fountain: ['water_fountain'], hydration: ['water_fountain', 'water'],
  restroom: ['restroom'], bathroom: ['restroom'], toilet: ['restroom'], wc: ['restroom'], lavatory: ['restroom'],
  food: ['free_food', 'food'], eat: ['free_food', 'food'], meal: ['free_food', 'food'], hungry: ['free_food', 'food'], grocery: ['free_food', 'food'], snap: ['usda_snap_office', 'free_food', 'food'], wic: ['usda_wic_office'],
  shelter: ['shelter', 'hurricane_shelter', 'warming_center', 'cooling_center'], housing: ['shelter'], sleep: ['shelter'], bed: ['shelter'], homeless: ['shelter', 'homeless_health_center'], warm: ['warming_center'], cool: ['cooling_center'],
  health: ['health_center', 'community_health_center', 'migrant_health_center', 'homeless_health_center', 'public_housing_health_center', 'school_based_health_center', 'federally_qualified_health_center', 'clinic', 'medical'],
  doctor: ['health_center', 'community_health_center', 'clinic', 'medical'], clinic: ['clinic', 'medical', 'health_center', 'community_health_center'],
  medical: ['medical', 'clinic', 'health_center', 'community_health_center', 'va_medical_center'], hospital: ['medical', 'clinic', 'health_center'],
  dental: ['dental'], dentist: ['dental'], teeth: ['dental'], eye: ['eye_care'], vision: ['eye_care'], glasses: ['eye_care'],
  mental: ['mental_health', 'suicide_prevention'], therapy: ['mental_health'], counseling: ['mental_health'], crisis: ['suicide_prevention', 'mental_health'], suicide: ['suicide_prevention'],
  addiction: ['addiction_services'], rehab: ['addiction_services'], drug: ['addiction_services', 'needle_exchange', 'safe_injection'], sober: ['addiction_services'], domestic: ['domestic_violence'], abuse: ['domestic_violence'],
  va: ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office', 'va_cemetery'],
  veteran: ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center', 'va_regional_office'], vet: ['va_facility', 'va_medical_center', 'va_outpatient_clinic', 'va_vet_center'], military: ['va_facility', 'va_medical_center'],
  wifi: ['wifi', 'internet'], internet: ['wifi', 'internet'], online: ['wifi', 'internet'],
  transit: ['transit'], bus: ['transit'], train: ['transit'], ride: ['transit'], transport: ['transit'],
  shower: ['shower'], laundry: ['laundry'], wash: ['laundry', 'handwashing', 'shower'], clean: ['laundry', 'shower', 'handwashing'], haircut: ['haircut'], barber: ['haircut'],
  charging: ['charging'], charge: ['charging'], power: ['charging'], phone: ['charging'], battery: ['charging'],
  library: ['library'], book: ['library'], books: ['library'],
  legal: ['legal'], lawyer: ['legal'], law: ['legal'], job: ['job_training'], work: ['job_training'], employment: ['job_training'], training: ['job_training'],
  tax: ['tax_help'], taxes: ['tax_help'], irs: ['tax_help'], social: ['social_services'],
  baby: ['baby_needs'], infant: ['baby_needs'], diaper: ['baby_needs'], pet: ['pet_services'], dog: ['pet_services'], cat: ['pet_services'], animal: ['pet_services'],
  needle: ['needle_exchange'], syringe: ['needle_exchange', 'safe_injection'], clothing: ['clothing'], clothes: ['clothing'], jacket: ['clothing'], coat: ['clothing'],
  bench: ['bench'], sit: ['bench'], seat: ['bench'], emergency: ['disaster_relief', 'hurricane_shelter', 'warming_center', 'cooling_center'], disaster: ['disaster_relief'],
  usda: ['usda_facility', 'usda_rural_development_office', 'usda_snap_office', 'usda_farm_service_center', 'usda_extension_office', 'usda_wic_office'], farm: ['usda_farm_service_center'],
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SearchScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const customTheme = useCustomTheme();
  const theme = isDarkMode ? colors.dark : colors.light;
  const { userLocation } = useLocationStore();
  const { utilities } = useUtilityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const toggleFilter = useCallback((key: string) => {
    if (key === 'all') {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters(prev =>
      prev.includes(key)
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters([]);
  }, []);

  // Build the set of matching categories from selected filter chips
  const filterCategorySet = useMemo(() => {
    if (selectedFilters.length === 0) return null;
    const cats = new Set<string>();
    for (const key of selectedFilters) {
      const filter = UTILITY_TYPES.find(f => f.key === key);
      if (filter) filter.categories.forEach(c => cats.add(c));
    }
    return cats;
  }, [selectedFilters]);

  // Local search + filter — same synonym-matching logic as MapScreen
  const filteredUtilities = useMemo(() => {
    let result = utilities;
    const query = searchQuery.toLowerCase().trim();

    // Text search: synonym matching + substring matching
    if (query) {
      const words = query.split(/\s+/);
      const synonymCategories = new Set<string>();
      for (const word of words) {
        const matches = SEARCH_SYNONYMS[word];
        if (matches) matches.forEach((c) => synonymCategories.add(c));
      }

      result = result.filter((u) => {
        // 1. Synonym match on category/type
        if (synonymCategories.size > 0) {
          if (synonymCategories.has(u.category) || (u.type && synonymCategories.has(u.type))) {
            return true;
          }
        }
        // 2. Substring match across text fields
        const fields = [u.name, u.category, u.type, u.address, u.description];
        return fields.some((f) => f?.toLowerCase().includes(query));
      });
    }

    // Apply category filter chips on top
    if (filterCategorySet) {
      result = result.filter(u => {
        const cat = u.category?.toLowerCase();
        const typ = u.type?.toLowerCase();
        return (cat && filterCategorySet.has(cat)) || (typ && filterCategorySet.has(typ));
      });
    }

    // Sort by distance (nearest first)
    if (userLocation) {
      result = [...result].sort((a, b) => {
        const da = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const db = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return da - db;
      });
    }

    return result;
  }, [utilities, searchQuery, filterCategorySet, userLocation]);

  const renderUtilityItem = useCallback(({ item, index }: { item: Utility; index: number }) => {
    const distance = userLocation
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude
        )
      : null;

    const utilityType = item.type || item.category || 'water_fountain';
    const utilityColor = getUtilityColor(utilityType);

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(250)}>
        <GlassCard
          variant="elevated"
          padding="md"
          style={styles.utilityCard}
        >
          <View style={styles.cardContent}>
            {/* Icon Container — glass circle with category SVG */}
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: isDarkMode
                  ? `${utilityColor.primary}25`
                  : `${utilityColor.primary}15`,
                borderColor: `${utilityColor.primary}30`,
              }
            ]}>
              <CategoryIcon category={utilityType} color={utilityColor.primary} size={22} />
            </View>

            {/* Content */}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text
                  style={[styles.utilityName, { color: theme.text.primary }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {distance !== null && (
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.distanceBadge}
                  >
                    <Text style={styles.distanceText}>
                      {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              <Text
                style={[styles.utilityDescription, { color: theme.text.secondary }]}
                numberOfLines={2}
              >
                {item.description || t('search.noDescription')}
              </Text>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                <Chip
                  label={getUtilityTypeName(utilityType as UtilityType)}
                  variant="utility"
                  utilityType={utilityType}
                  size="sm"
                />
                {item.isAccessible && (
                  <Chip
                    label="Accessible"
                    variant="filled"
                    size="sm"
                    style={styles.tagChip}
                  />
                )}
                {item.is24Hours && (
                  <Chip
                    label="24h"
                    variant="filled"
                    size="sm"
                    style={styles.tagChip}
                  />
                )}
              </View>

              {/* Address */}
              {item.address && (
                <View style={styles.addressRow}>
                  <LocationPinIcon color={theme.text.tertiary} />
                  <Text
                    style={[styles.address, { color: theme.text.tertiary }]}
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }, [userLocation, theme, isDarkMode, t]);

  const renderEmptyState = useMemo(() => {
    const isSearching = searchQuery.length > 0 || selectedFilters.length > 0;
    return (
      <View style={styles.emptyContainer}>
        {/* Glassmorphic icon circle */}
        <View style={[styles.emptyIconOuter, {
          backgroundColor: isDarkMode ? 'rgba(102,126,234,0.08)' : 'rgba(102,126,234,0.06)',
        }]}>
          <LinearGradient
            colors={[`${colors.gradient.start}20`, `${colors.gradient.end}15`]}
            style={styles.emptyIconInner}
          >
            {isSearching ? (
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.gradient.start} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="11" cy="11" r="7" />
                <Line x1="16.5" y1="16.5" x2="21" y2="21" />
                <Line x1="8" y1="11" x2="14" y2="11" />
              </Svg>
            ) : (
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.gradient.start} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="11" cy="11" r="7" />
                <Line x1="16.5" y1="16.5" x2="21" y2="21" />
              </Svg>
            )}
          </LinearGradient>
        </View>

        <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
          {isSearching ? 'No Results Found' : 'Search Utilities'}
        </Text>
        <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
          {isSearching
            ? 'Try adjusting your search or filters'
            : 'Find water fountains, restrooms, and more near you'}
        </Text>

        {/* Quick action chips in empty state */}
        {!isSearching && (
          <View style={styles.quickActions}>
            {UTILITY_TYPES.slice(0, 4).map((type) => (
              <Pressable
                key={type.key}
                onPress={() => toggleFilter(type.key)}
                style={[styles.quickChip, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(102,126,234,0.08)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.15)',
                }]}
              >
                <FilterChipIcon type={type.key} color={isDarkMode ? 'rgba(255,255,255,0.6)' : colors.gradient.start} />
                <Text style={[styles.quickChipLabel, {
                  color: isDarkMode ? 'rgba(255,255,255,0.6)' : colors.gradient.start,
                }]}>{type.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }, [searchQuery, selectedFilters.length, theme, isDarkMode, toggleFilter]);


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient gradient background — subtle, not a header block */}
      <LinearGradient
        colors={isDarkMode
          ? [`${colors.gradient.start}30`, `${colors.gradient.end}15`, 'transparent']
          : [`${colors.gradient.start}18`, `${colors.gradient.end}10`, 'transparent']
        }
        style={styles.ambientGradient}
        locations={[0, 0.4, 1]}
      />

      {/* Header area */}
      <View style={[styles.header, { paddingTop: insets.top + tokens.spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          Search
        </Text>

        {/* Glassmorphic Search Bar */}
        <View style={[styles.searchContainer, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(102,126,234,0.2)',
        }]}>
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={isDarkMode ? 20 : 40}
              tint={isDarkMode ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.searchInner}>
            <SearchIcon size={19} color={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(102,126,234,0.6)'} />
            <TextInput
              style={[styles.searchInput, { color: theme.text.primary }]}
              placeholder={t('search.placeholder')}
              placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} hitSlop={tokens.hitSlop.medium}>
                <View style={[styles.clearButton, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                }]}>
                  <ClearIcon color={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
          style={styles.filtersScroll}
        >
          {UTILITY_TYPES.map((type) => {
            const isActive = type.key === 'all' ? selectedFilters.length === 0 : selectedFilters.includes(type.key);
            const chipColor = type.key === 'all' ? { primary: colors.gradient.start } : getUtilityColor(type.key);
            return (
              <Pressable
                key={type.key}
                onPress={() => toggleFilter(type.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? chipColor.primary
                      : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)',
                    borderColor: isActive
                      ? chipColor.primary
                      : isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(102,126,234,0.15)',
                  },
                ]}
              >
                <FilterChipIcon
                  type={type.key}
                  color={isActive ? '#FFFFFF' : (isDarkMode ? 'rgba(255,255,255,0.6)' : chipColor.primary)}
                />
                <Text style={[
                  styles.filterChipLabel,
                  {
                    color: isActive
                      ? '#FFFFFF'
                      : isDarkMode ? 'rgba(255,255,255,0.7)' : theme.text.secondary,
                  }
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
          {selectedFilters.length > 0 && (
            <Pressable
              onPress={clearFilters}
              style={[styles.clearFiltersChip, {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.2)',
              }]}
            >
              <ClearIcon size={12} color={isDarkMode ? 'rgba(255,255,255,0.5)' : colors.state.error} />
              <Text style={[styles.clearFiltersLabel, {
                color: isDarkMode ? 'rgba(255,255,255,0.5)' : colors.state.error,
              }]}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Results */}
      <FlatList
          data={filteredUtilities}
          renderItem={renderUtilityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={undefined}
          ListEmptyComponent={renderEmptyState}
        />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
            Filter by Type
          </Text>

          <View style={styles.filterGrid}>
            {UTILITY_TYPES.map((type) => {
              const isSelected = selectedFilters.includes(type.key);
              const utilityColor = getUtilityColor(type.key);

              return (
                <Pressable
                  key={type.key}
                  onPress={() => toggleFilter(type.key)}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: isSelected
                        ? utilityColor.primary
                        : isDarkMode ? colors.dark.glass : colors.light.glass,
                      borderColor: utilityColor.primary,
                    },
                  ]}
                >
                  <CategoryIcon
                    category={type.key}
                    color={isSelected ? '#FFFFFF' : utilityColor.primary}
                    size={20}
                  />
                  <Text style={[
                    styles.filterOptionLabel,
                    { color: isSelected ? '#FFFFFF' : theme.text.primary }
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <GradientButton
              title="Clear All"
              variant="outlined"
              onPress={clearFilters}
              style={styles.modalButton}
            />
            <GradientButton
              title="Apply"
              onPress={() => setIsFilterModalVisible(false)}
              style={styles.modalButton}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Ambient background gradient — subtle wash, not a block
  ambientGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 280,
  },

  // Header
  header: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  headerTitle: {
    ...tokens.typography.headlineLarge,
    marginBottom: tokens.spacing.md,
  },

  // Search
  searchContainer: {
    borderRadius: tokens.radius.searchBar,
    overflow: 'hidden',
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 19,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: tokens.spacing.sm,
    includeFontPadding: false,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filters
  filtersScroll: {
    marginHorizontal: -tokens.spacing.md,
  },
  filtersScrollContent: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 8,
    borderRadius: tokens.radius.chip,
    marginRight: tokens.spacing.sm,
    borderWidth: 1,
    gap: 6,
  },
  filterChipLabel: {
    ...tokens.typography.labelMedium,
  },
  clearFiltersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 8,
    borderRadius: tokens.radius.chip,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  clearFiltersLabel: {
    ...tokens.typography.labelSmall,
  },

  // List
  listContainer: {
    padding: tokens.spacing.md,
    paddingBottom: 100,
  },

  // Utility Card
  utilityCard: {
    marginBottom: tokens.spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
    borderWidth: 1,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  utilityName: {
    ...tokens.typography.titleMedium,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  distanceBadge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
  },
  distanceText: {
    ...tokens.typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  utilityDescription: {
    ...tokens.typography.bodySmall,
    marginBottom: tokens.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.xs,
  },
  tagChip: {
    marginLeft: tokens.spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
    gap: 4,
  },
  address: {
    ...tokens.typography.bodySmall,
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxxl,
    paddingHorizontal: tokens.spacing.xl,
  },
  emptyIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...tokens.typography.titleLarge,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...tokens.typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    borderRadius: tokens.radius.chip,
    borderWidth: 1,
    gap: 6,
  },
  quickChipLabel: {
    ...tokens.typography.labelMedium,
  },

  // Loading
  loadingContainer: {
    padding: tokens.spacing.md,
  },

  // Modal
  modalContainer: {
    margin: tokens.spacing.lg,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.modal,
  },
  modalTitle: {
    ...tokens.typography.headlineSmall,
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  filterOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  filterOptionLabel: {
    ...tokens.typography.labelMedium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: tokens.spacing.xs,
  },
});

export default SearchScreen;
