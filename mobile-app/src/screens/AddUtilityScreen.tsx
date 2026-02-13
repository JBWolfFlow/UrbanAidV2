import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Text,
  Platform,
  Switch as RNSwitch,
  KeyboardAvoidingView,
} from 'react-native';
import { Portal, Modal, RadioButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ExpoLocation from 'expo-location';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { useMutation } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore } from '../stores/locationStore';
import { useThemeStore } from '../stores/themeStore';
import { Utility, UtilityCategory, UtilityType, UtilityCreateData } from '../types/utility';
import { apiService } from '../services/apiService';
import { colors, getUtilityColor } from '../theme/colors';
import { tokens } from '../theme/tokens';
import { GlassCard, GradientButton, ModernInput } from '../components/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── SVG Icon Components ────────────────────────────────────────────────

const UtilityTypeIcon: React.FC<{ type: string; color: string; size?: number }> = ({ type, color, size = 20 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 2 as number, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const lower = type.toLowerCase();

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
  if (lower.includes('shelter') || lower.includes('warming') || lower.includes('cooling'))
    return <Svg {...p}><Path d="M3 12l9-9 9 9" /><Path d="M5 10v10h14V10" /><Rect x="9" y="14" width="6" height="6" /></Svg>;
  if (lower.includes('health') || lower === 'clinic' || lower === 'medical')
    return <Svg {...p}><Path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" /></Svg>;
  if (lower === 'transit')
    return <Svg {...p}><Rect x="4" y="3" width="16" height="14" rx="2" /><Path d="M4 10h16" /><Path d="M12 3v7" /><Circle cx="7.5" cy="20" r="1.5" fill={color} /><Circle cx="16.5" cy="20" r="1.5" fill={color} /><Path d="M4 17h16" /></Svg>;
  if (lower.startsWith('va_'))
    return <Svg {...p}><Path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 2.9 1.1-6.5L2.6 8.8l6.5-.9L12 2z" /></Svg>;
  if (lower.startsWith('usda'))
    return <Svg {...p}><Path d="M17 8C8 10 5.9 16.2 3.8 19.6" /><Path d="M20.5 4.5C16.5 3 6 5.5 3 19c2.5-2.5 6-4 10-4 3 0 5.5.5 7.5 1.5C21 12 20.5 4.5 20.5 4.5Z" /></Svg>;
  // default: generic circle
  return <Svg {...p}><Circle cx="12" cy="12" r="9" /></Svg>;
};

// Step-specific SVG icons
const StepIcon: React.FC<{ step: number; color: string; size?: number }> = ({ step, color, size = 16 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth: 2.5 as number, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (step) {
    case 1: // document
      return <Svg {...p}><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Path d="M14 2v6h6" /><Line x1="16" y1="13" x2="8" y2="13" /><Line x1="16" y1="17" x2="8" y2="17" /></Svg>;
    case 2: // map-pin
      return <Svg {...p}><Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><Circle cx="12" cy="9" r="2.5" /></Svg>;
    case 3: // checkmark
      return <Svg {...p}><Path d="M20 6L9 17l-5-5" /></Svg>;
    default:
      return null;
  }
};

// Checkmark SVG (reused in multiple places)
const CheckmarkIcon: React.FC<{ color?: string; size?: number }> = ({ color = '#FFFFFF', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// Chevron-left SVG for back button
const ChevronLeftIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 18l-6-6 6-6" />
  </Svg>
);

// Accessibility icon (universal access)
const AccessibilityIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="4.5" r="2" />
    <Path d="M7 8h10" />
    <Path d="M12 8v5" />
    <Path d="M9.5 20l2.5-5 2.5 5" />
  </Svg>
);

// Clock icon (24/7)
const ClockIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

// Location pin icon (for preview)
const LocationPinIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <Circle cx="12" cy="9" r="2.5" />
  </Svg>
);

// ─── Data ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Details' },
  { id: 2, title: 'Location' },
  { id: 3, title: 'Confirm' },
];

const utilityTypes = [
  { value: 'water_fountain', label: 'Water Fountain' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'food', label: 'Food/Pantry' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'health_center', label: 'Health Services' },
  { value: 'wifi', label: 'WiFi Hotspot' },
  { value: 'transit', label: 'Transit Stop' },
  { value: 'va_facility', label: 'VA Facility' },
  { value: 'usda_facility', label: 'USDA Office' },
  { value: 'charging_station', label: 'Charging Station' },
  { value: 'other', label: 'Other' },
];

// ─── Sub-components ─────────────────────────────────────────────────────

interface StepIndicatorProps {
  currentStep: number;
  isDarkMode: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, isDarkMode }) => {
  return (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <View style={styles.stepItemContainer}>
              {isActive ? (
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.end]}
                  style={styles.stepCircle}
                >
                  <StepIcon step={step.id} color="#FFFFFF" size={16} />
                </LinearGradient>
              ) : isCompleted ? (
                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                  <CheckmarkIcon color="#FFFFFF" size={14} />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(120, 120, 128, 0.2)',
                    },
                  ]}
                >
                  <StepIcon
                    step={step.id}
                    color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(120,120,128,0.6)'}
                    size={16}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.stepLabel,
                  { color: isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary },
                  isActive && { color: colors.gradient.start, fontWeight: '600' },
                  isCompleted && { color: colors.accent.mint },
                ]}
              >
                {step.title}
              </Text>
            </View>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              isCompleted ? (
                <LinearGradient
                  colors={[colors.accent.mint, `${colors.accent.mint}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.stepConnector}
                />
              ) : (
                <View
                  style={[
                    styles.stepConnector,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(120, 120, 128, 0.2)',
                    },
                  ]}
                />
              )
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

interface FeatureToggleProps {
  icon: 'accessibility' | 'clock';
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDarkMode: boolean;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  isDarkMode,
}) => {
  const textColor = isDarkMode ? colors.dark.text.primary : colors.light.text.primary;
  const secondaryColor = isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary;

  return (
    <View style={styles.featureToggle}>
      <View
        style={[
          styles.featureIconContainer,
          { backgroundColor: `${colors.gradient.start}15` },
        ]}
      >
        {icon === 'accessibility' ? (
          <AccessibilityIcon color={colors.gradient.start} />
        ) : (
          <ClockIcon color={colors.gradient.start} />
        )}
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: secondaryColor }]}>
          {description}
        </Text>
      </View>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: isDarkMode ? '#39393D' : '#E9E9EB',
          true: colors.gradient.start,
        }}
        thumbColor={Platform.OS === 'android' ? (value ? colors.gradient.end : '#f4f3f4') : undefined}
        ios_backgroundColor={isDarkMode ? '#39393D' : '#E9E9EB'}
      />
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────

const AddUtilityScreen: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const { userLocation } = useLocationStore();

  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [currentStep, setCurrentStep] = useState(1);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    address: '',
    isAccessible: false,
    is24Hours: false,
    latitude: userLocation?.latitude || 47.6062,
    longitude: userLocation?.longitude || -122.3321,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);

  // Add utility mutation — calls POST /utilities on the FastAPI backend
  const addUtilityMutation = useMutation({
    mutationFn: async (data: UtilityCreateData) => {
      return apiService.createUtility(data);
    },
    onSuccess: () => {
      // MapScreen's useFocusEffect re-fetches from Zustand store on tab focus,
      // so no cache invalidation needed here.
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setCurrentStep(1);
      }, 2000);
    },
    onError: (error) => {
      console.error('Create utility failed:', error);
      Alert.alert('Error', 'Failed to add utility. Please try again.');
    },
  });

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      type: '',
      address: '',
      isAccessible: false,
      is24Hours: false,
      latitude: userLocation?.latitude || 47.6062,
      longitude: userLocation?.longitude || -122.3321,
    });
  }, [userLocation]);

  const validateStep = useCallback(
    (step: number): boolean => {
      if (step === 1) {
        if (!formData.name.trim()) {
          Alert.alert('Required', 'Please enter a name for the utility');
          return false;
        }
        if (!formData.type) {
          Alert.alert('Required', 'Please select a utility type');
          return false;
        }
      }
      return true;
    },
    [formData]
  );

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    // Geocode the address when moving from Details → Location
    if (currentStep === 1 && formData.address.trim()) {
      setIsGeocoding(true);
      try {
        const results = await ExpoLocation.geocodeAsync(formData.address.trim());
        if (results.length > 0) {
          updateFormData('latitude', results[0].latitude);
          updateFormData('longitude', results[0].longitude);
        }
      } catch (e) {
        console.warn('Geocoding failed, using current position:', e);
      } finally {
        setIsGeocoding(false);
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }, [currentStep, validateStep, formData.address, updateFormData]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(() => {
    const utilityData: UtilityCreateData = {
      name: formData.name.trim(),
      category: formData.type as UtilityCategory,
      latitude: formData.latitude,
      longitude: formData.longitude,
      description: formData.description.trim() || undefined,
      address: formData.address.trim() || undefined,
      wheelchair_accessible: formData.isAccessible,
    };

    addUtilityMutation.mutate(utilityData);
  }, [formData, addUtilityMutation]);

  const getSelectedType = useCallback(() => {
    return utilityTypes.find((t) => t.value === formData.type);
  }, [formData.type]);

  const handleMapPress = useCallback(
    (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      updateFormData('latitude', latitude);
      updateFormData('longitude', longitude);
    },
    [updateFormData]
  );

  // ─── Step 1: Details ────────────────────────────────────────────
  const renderDetailsStep = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <GlassCard style={styles.card} variant="elevated">
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Basic Information
        </Text>

        <ModernInput
          label="Utility Name"
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
          placeholder="e.g., Central Park Water Fountain"
          required
        />

        <View style={styles.spacer} />

        <ModernInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          placeholder="Optional notes about this utility"
          multiline
          numberOfLines={3}
        />

        <View style={styles.spacer} />

        {/* Type Selector */}
        <Pressable
          style={[
            styles.typeSelector,
            {
              borderColor: formData.type ? colors.gradient.start : themeColors.glassBorder,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            },
          ]}
          onPress={() => setIsTypeModalVisible(true)}
        >
          <Text style={[styles.typeSelectorLabel, { color: themeColors.text.secondary }]}>
            Utility Type *
          </Text>
          {formData.type ? (
            <View style={styles.selectedType}>
              <View style={[styles.selectedTypeIconWrap, { backgroundColor: `${getUtilityColor(formData.type).primary}20` }]}>
                <UtilityTypeIcon type={formData.type} color={getUtilityColor(formData.type).primary} size={20} />
              </View>
              <Text style={[styles.selectedTypeLabel, { color: themeColors.text.primary }]}>
                {getSelectedType()?.label}
              </Text>
            </View>
          ) : (
            <Text style={[styles.typePlaceholder, { color: themeColors.text.tertiary }]}>
              Select a type...
            </Text>
          )}
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={themeColors.text.secondary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </Pressable>

        <View style={styles.spacer} />

        <ModernInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => updateFormData('address', text)}
          placeholder="Street address or landmark"
        />
      </GlassCard>

      <GlassCard style={styles.card} variant="elevated">
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>Features</Text>

        <FeatureToggle
          icon="accessibility"
          title="Wheelchair Accessible"
          description="This utility is accessible to wheelchair users"
          value={formData.isAccessible}
          onValueChange={(value) => updateFormData('isAccessible', value)}
          isDarkMode={isDarkMode}
        />

        <View style={[styles.featureDivider, { backgroundColor: themeColors.divider }]} />

        <FeatureToggle
          icon="clock"
          title="24/7 Available"
          description="Available around the clock"
          value={formData.is24Hours}
          onValueChange={(value) => updateFormData('is24Hours', value)}
          isDarkMode={isDarkMode}
        />
      </GlassCard>
    </Animated.View>
  );

  // ─── Step 2: Location ───────────────────────────────────────────
  const renderLocationStep = () => (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
      <GlassCard style={styles.card} variant="elevated">
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Set Location
        </Text>
        <Text style={[styles.cardSubtitle, { color: themeColors.text.secondary }]}>
          Tap on the map to adjust the utility marker
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={{
              latitude: formData.latitude,
              longitude: formData.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={{
                latitude: formData.latitude,
                longitude: formData.longitude,
              }}
            >
              <View style={styles.markerContainer}>
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.end]}
                  style={styles.marker}
                >
                  <UtilityTypeIcon
                    type={formData.type || 'default'}
                    color="#FFFFFF"
                    size={22}
                  />
                </LinearGradient>
                <View style={styles.markerPointer} />
              </View>
            </Marker>
          </MapView>

          {/* Location Overlay */}
          <View style={styles.locationOverlay}>
            <BlurView
              intensity={isDarkMode ? 60 : 80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={styles.locationBadge}
            >
              <Text style={[styles.locationText, { color: themeColors.text.primary }]}>
                {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
              </Text>
            </BlurView>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  // ─── Step 3: Confirm ────────────────────────────────────────────
  const renderConfirmStep = () => {
    const selectedType = getSelectedType();
    const typeColors = formData.type ? getUtilityColor(formData.type) : null;

    return (
      <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
        <GlassCard style={styles.card} variant="elevated">
          <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
            Review & Submit
          </Text>

          {/* Preview Card */}
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.02)',
                borderColor: typeColors?.primary || themeColors.glassBorder,
              },
            ]}
          >
            {/* Type Badge */}
            {selectedType && (
              <View
                style={[
                  styles.previewTypeBadge,
                  { backgroundColor: typeColors?.primary || colors.gradient.start },
                ]}
              >
                <UtilityTypeIcon type={formData.type} color="#FFFFFF" size={14} />
                <Text style={styles.previewTypeLabel}>{selectedType.label}</Text>
              </View>
            )}

            {/* Name */}
            <Text style={[styles.previewName, { color: themeColors.text.primary }]}>
              {formData.name || 'Unnamed Utility'}
            </Text>

            {/* Description */}
            {formData.description ? (
              <Text style={[styles.previewDescription, { color: themeColors.text.secondary }]}>
                {formData.description}
              </Text>
            ) : null}

            {/* Address */}
            {formData.address ? (
              <View style={styles.previewRow}>
                <LocationPinIcon color={themeColors.text.secondary} size={14} />
                <Text style={[styles.previewRowText, { color: themeColors.text.secondary }]}>
                  {formData.address}
                </Text>
              </View>
            ) : null}

            {/* Features */}
            <View style={styles.previewFeatures}>
              {formData.isAccessible && (
                <View style={styles.previewFeatureBadge}>
                  <AccessibilityIcon color={colors.gradient.start} size={13} />
                  <Text style={styles.previewFeatureText}>Accessible</Text>
                </View>
              )}
              {formData.is24Hours && (
                <View style={styles.previewFeatureBadge}>
                  <ClockIcon color={colors.gradient.start} size={13} />
                  <Text style={styles.previewFeatureText}>24/7</Text>
                </View>
              )}
            </View>
          </View>

          {/* Mini Map */}
          <View style={styles.miniMapContainer}>
            <MapView
              style={styles.miniMap}
              provider={PROVIDER_GOOGLE}
              scrollEnabled={false}
              zoomEnabled={false}
              region={{
                latitude: formData.latitude,
                longitude: formData.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
              >
                <View style={styles.miniMarker}>
                  <UtilityTypeIcon type={formData.type || 'default'} color="#FFFFFF" size={16} />
                </View>
              </Marker>
            </MapView>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  // ─── Success State ──────────────────────────────────────────────
  if (showSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.successContent}>
            <LinearGradient
              colors={[colors.gradientSuccess.start, colors.gradientSuccess.end]}
              style={styles.successCircle}
            >
              <CheckmarkIcon color="#FFFFFF" size={48} />
            </LinearGradient>
            <Text style={[styles.successTitle, { color: themeColors.text.primary }]}>
              Utility Added!
            </Text>
            <Text style={[styles.successSubtitle, { color: themeColors.text.secondary }]}>
              Thank you for contributing to the community
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Layout ────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Ambient gradient background */}
      <LinearGradient
        colors={isDarkMode
          ? [`${colors.gradient.start}30`, `${colors.gradient.end}15`, 'transparent']
          : [`${colors.gradient.start}18`, `${colors.gradient.end}10`, 'transparent']
        }
        style={styles.ambientGradient}
        locations={[0, 0.4, 1]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Step Indicator */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
            Add New Utility
          </Text>
          <StepIndicator currentStep={currentStep} isDarkMode={isDarkMode} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderDetailsStep()}
          {currentStep === 2 && renderLocationStep()}
          {currentStep === 3 && renderConfirmStep()}

          {/* Navigation buttons — inline, scroll with content */}
          <View style={styles.bottomNav}>
            {currentStep > 1 ? (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <View style={styles.backButtonContent}>
                  <ChevronLeftIcon color={themeColors.text.secondary} size={18} />
                  <Text style={[styles.backButtonText, { color: themeColors.text.secondary }]}>
                    Back
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}

            {currentStep < 3 ? (
              <GradientButton title={isGeocoding ? 'Locating...' : 'Next'} onPress={handleNext} size="md" disabled={isGeocoding} />
            ) : (
              <GradientButton
                title={addUtilityMutation.isPending ? 'Submitting...' : 'Submit'}
                onPress={handleSubmit}
                size="md"
                disabled={addUtilityMutation.isPending}
              />
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Type Selection Modal */}
      <Portal>
        <Modal
          visible={isTypeModalVisible}
          onDismiss={() => setIsTypeModalVisible(false)}
          contentContainerStyle={styles.modalWrapper}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={styles.modalBlur}
            >
              <View style={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                  Select Utility Type
                </Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {utilityTypes.map((type) => {
                    const typeColor = getUtilityColor(type.value);
                    const isSelected = formData.type === type.value;

                    return (
                      <Pressable
                        key={type.value}
                        style={[
                          styles.typeItem,
                          isSelected && {
                            backgroundColor: `${typeColor.primary}20`,
                            borderWidth: 1,
                            borderColor: `${typeColor.primary}40`,
                          },
                        ]}
                        onPress={() => {
                          updateFormData('type', type.value);
                          setIsTypeModalVisible(false);
                        }}
                      >
                        <View
                          style={[
                            styles.typeItemIcon,
                            { backgroundColor: `${typeColor.primary}20` },
                          ]}
                        >
                          <UtilityTypeIcon type={type.value} color={typeColor.primary} size={22} />
                        </View>
                        <Text style={[styles.typeItemLabel, { color: themeColors.text.primary }]}>
                          {type.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.typeCheck, { backgroundColor: typeColor.primary }]}>
                            <CheckmarkIcon color="#FFFFFF" size={12} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsTypeModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.gradient.start }]}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </BlurView>
          ) : (
            <View
              style={[
                styles.modalContent,
                styles.modalAndroid,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                Select Utility Type
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {utilityTypes.map((type) => {
                  const typeColor = getUtilityColor(type.value);
                  const isSelected = formData.type === type.value;

                  return (
                    <Pressable
                      key={type.value}
                      style={[
                        styles.typeItem,
                        isSelected && {
                          backgroundColor: `${typeColor.primary}20`,
                          borderWidth: 1,
                          borderColor: `${typeColor.primary}40`,
                        },
                      ]}
                      onPress={() => {
                        updateFormData('type', type.value);
                        setIsTypeModalVisible(false);
                      }}
                    >
                      <View
                        style={[
                          styles.typeItemIcon,
                          { backgroundColor: `${typeColor.primary}20` },
                        ]}
                      >
                        <UtilityTypeIcon type={type.value} color={typeColor.primary} size={22} />
                      </View>
                      <Text style={[styles.typeItemLabel, { color: themeColors.text.primary }]}>
                        {type.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.typeCheck, { backgroundColor: typeColor.primary }]}>
                          <CheckmarkIcon color="#FFFFFF" size={12} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setIsTypeModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.gradient.start }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Ambient background gradient
  ambientGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 280,
  },

  // Header
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  headerTitle: {
    fontSize: tokens.typography.headlineMedium.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  stepItemContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: colors.accent.mint,
  },
  stepLabel: {
    fontSize: tokens.typography.labelMedium.fontSize,
  },
  stepConnector: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginHorizontal: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },

  // Card
  card: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  cardTitle: {
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: '600',
    marginBottom: tokens.spacing.md,
  },
  cardSubtitle: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    marginBottom: tokens.spacing.md,
  },
  spacer: {
    height: tokens.spacing.md,
  },

  // Type Selector
  typeSelector: {
    borderWidth: 1.5,
    borderRadius: tokens.radius.input,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeSelectorLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    fontSize: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedTypeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  selectedTypeLabel: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  typePlaceholder: {
    flex: 1,
    fontSize: tokens.typography.bodyLarge.fontSize,
  },

  // Feature Toggle
  featureToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  featureDescription: {
    fontSize: tokens.typography.labelMedium.fontSize,
    marginTop: 2,
  },
  featureDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },

  // Map
  mapContainer: {
    height: 300,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.gradient.end,
    marginTop: -2,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: tokens.spacing.md,
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    alignItems: 'center',
  },
  locationBadge: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  locationText: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '500',
  },

  // Preview Card
  previewCard: {
    borderWidth: 2,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  previewTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    marginBottom: tokens.spacing.md,
    gap: 6,
  },
  previewTypeLabel: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewName: {
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  previewDescription: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    marginBottom: tokens.spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    gap: 6,
  },
  previewRowText: {
    fontSize: tokens.typography.bodyLarge.fontSize,
  },
  previewFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  previewFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    gap: 5,
  },
  previewFeatureText: {
    fontSize: tokens.typography.labelMedium.fontSize,
    color: colors.gradient.start,
    fontWeight: '500',
  },

  // Mini Map
  miniMapContainer: {
    height: 120,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  miniMap: {
    flex: 1,
  },
  miniMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gradient.start,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
  },
  backButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    minWidth: 80,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  bottomPadding: {
    height: tokens.sizes.tabBarHeight + tokens.spacing.md,
  },

  // Modal
  modalWrapper: {
    margin: tokens.spacing.lg,
    maxHeight: '80%',
  },
  modalBlur: {
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
  },
  modalContent: {
    padding: tokens.spacing.lg,
  },
  modalAndroid: {
    borderRadius: tokens.radius.xl,
  },
  modalTitle: {
    fontSize: tokens.typography.titleLarge.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.xs,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  typeItemIcon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  typeItemLabel: {
    flex: 1,
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  typeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  modalCancelText: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '600',
  },

  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  successContent: {
    alignItems: 'center',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  successTitle: {
    fontSize: tokens.typography.headlineMedium.fontSize,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
  },
  successSubtitle: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    textAlign: 'center',
  },
});

export default AddUtilityScreen;
