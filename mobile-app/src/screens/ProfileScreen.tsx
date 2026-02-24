import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Switch as RNSwitch,
  Text,
  Platform,
  Image,
  ActionSheetIOS,
} from 'react-native';
import { Portal, Modal, RadioButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../stores/themeStore';
import { useLocationStore } from '../stores/locationStore';
import { useUtilityStore } from '../stores/utilityStore';
import { colors } from '../theme/colors';
import { tokens } from '../theme/tokens';
import { GlassCard } from '../components/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Setting item icon colors by category
const iconColors = {
  appearance: { bg: 'rgba(102, 126, 234, 0.15)', icon: colors.gradient.start },
  language: { bg: 'rgba(83, 82, 237, 0.15)', icon: colors.accent.electric },
  notification: { bg: 'rgba(255, 107, 107, 0.15)', icon: colors.accent.coral },
  privacy: { bg: 'rgba(46, 213, 115, 0.15)', icon: colors.accent.mint },
  info: { bg: 'rgba(102, 126, 234, 0.15)', icon: colors.gradient.start },
  storage: { bg: 'rgba(249, 115, 22, 0.15)', icon: '#F97316' },
  danger: { bg: 'rgba(239, 68, 68, 0.15)', icon: colors.state.error },
};

// SVG icon lookup by setting identifier
const settingIconMap: Record<string, (color: string) => React.ReactNode> = {
  // Appearance - half moon
  'dark-mode': (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Language - globe
  language: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={c} strokeWidth={2} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Notification - bell
  notification: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Location - map pin
  location: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={10} r={3} stroke={c} strokeWidth={2} />
    </Svg>
  ),
  // Export - upload/share box
  export: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8l-5-5-5 5M12 3v12" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Version - info circle
  version: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={c} strokeWidth={2} />
      <Line x1={12} y1={16} x2={12} y2={12} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={0.5} fill={c} stroke={c} strokeWidth={1} />
    </Svg>
  ),
  // Privacy policy - shield
  shield: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Terms - document
  document: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // About - heart
  heart: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  // Storage - trash
  storage: (c) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};

interface SettingItemProps {
  icon: string;
  title: string;
  description?: string;
  colorType: keyof typeof iconColors;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  isDarkMode: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  description,
  colorType,
  onPress,
  rightElement,
  showChevron = false,
  isDarkMode,
}) => {
  const scale = useSharedValue(1);
  const colorConfig = iconColors[colorType];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  const textColor = isDarkMode ? colors.dark.text.primary : colors.light.text.primary;
  const secondaryColor = isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary;

  const renderIcon = settingIconMap[icon];

  return (
    <AnimatedPressable
      style={[styles.settingItem, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: colorConfig.bg }]}>
        {renderIcon ? renderIcon(colorConfig.icon) : <Text style={[styles.settingIcon, { color: colorConfig.icon }]}>{icon}</Text>}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: secondaryColor }]}>
            {description}
          </Text>
        )}
      </View>
      {rightElement}
      {showChevron && !rightElement && (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke={secondaryColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </AnimatedPressable>
  );
};

interface ModernSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({ value, onValueChange, disabled }) => {
  const { isDarkMode } = useThemeStore();
  const offTrackColor = isDarkMode ? '#39393D' : '#E9E9EB';

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: offTrackColor,
        true: colors.gradient.start,
      }}
      thumbColor={Platform.OS === 'android' ? (value ? colors.gradient.end : '#f4f3f4') : undefined}
      ios_backgroundColor={offTrackColor}
      style={styles.switch}
    />
  );
};

const PROFILE_IMAGE_KEY = '@urbanaid_profile_image';
const USERNAME_KEY = '@urbanaid_username';
const DEFAULT_USERNAME = 'UrbanAid User';

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { hasLocationPermission } = useLocationStore();
  const { utilities } = useUtilityStore();

  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState(DEFAULT_USERNAME);

  const themeColors = isDarkMode ? colors.dark : colors.light;

  // Load saved profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [savedImage, savedUsername] = await Promise.all([
          AsyncStorage.getItem(PROFILE_IMAGE_KEY),
          AsyncStorage.getItem(USERNAME_KEY),
        ]);
        if (savedImage) {
          setProfileImage(savedImage);
        }
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    loadProfileData();
  }, []);

  // Save profile image to storage
  const saveProfileImage = async (uri: string) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
      setProfileImage(uri);
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  // Pick image from library
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      saveProfileImage(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      saveProfileImage(result.assets[0].uri);
    }
  };

  // Remove profile picture
  const removeProfileImage = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      setProfileImage(null);
    } catch (error) {
      console.error('Error removing profile image:', error);
    }
  };

  // Save username to storage
  const saveUsername = async (name: string) => {
    try {
      const trimmedName = name.trim() || DEFAULT_USERNAME;
      await AsyncStorage.setItem(USERNAME_KEY, trimmedName);
      setUsername(trimmedName);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  // Handle username tap - show edit prompt
  const handleUsernamePress = () => {
    Alert.prompt(
      'Edit Name',
      'Enter your display name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName !== undefined) {
              saveUsername(newName);
            }
          },
        },
      ],
      'plain-text',
      username === DEFAULT_USERNAME ? '' : username,
    );
  };

  // Show image picker options
  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      const options = profileImage
        ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
        : ['Take Photo', 'Choose from Library', 'Cancel'];
      const cancelIndex = profileImage ? 3 : 2;
      const destructiveIndex = profileImage ? 2 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            takePhoto();
          } else if (buttonIndex === 1) {
            pickImage();
          } else if (profileImage && buttonIndex === 2) {
            removeProfileImage();
          }
        },
      );
    } else {
      // Android fallback
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
          ...(profileImage ? [{ text: 'Remove Photo', onPress: removeProfileImage, style: 'destructive' as const }] : []),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    }
  };

  // Derive real stats from loaded utilities
  const totalUtilities = utilities.length;
  const verifiedCount = utilities.filter(u => u.verified).length;
  const categoryCount = new Set(utilities.map(u => u.category)).size;

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const handleLanguageChange = useCallback((languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsLanguageModalVisible(false);
    Alert.alert(
      'Language Changed',
      `Language set to ${languages.find((l) => l.code === languageCode)?.name}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert('Clear Cache', 'This will clear all cached data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Success', 'Cache cleared successfully');
        },
      },
    ]);
  }, []);

  const handleDataExport = useCallback(() => {
    Alert.alert('Export Data', 'Export your added utilities and preferences?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          Alert.alert('Success', 'Data exported successfully');
        },
      },
    ]);
  }, []);

  const getSelectedLanguageName = useCallback(() => {
    return languages.find((l) => l.code === selectedLanguage)?.name || 'English';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const renderSectionTitle = (title: string) => (
    <Text style={[styles.sectionTitle, { color: themeColors.text.secondary }]}>
      {title.toUpperCase()}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={isDarkMode
          ? [`${colors.gradient.start}25`, `${colors.gradient.end}12`, 'transparent']
          : [`${colors.gradient.start}15`, `${colors.gradient.end}08`, 'transparent']
        }
        style={styles.ambientGradient}
        locations={[0, 0.5, 1]}
        pointerEvents="none"
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Gradient Header with Avatar - extends to top of screen */}
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + tokens.spacing.xl }]}
        >
          <View style={styles.avatarContainer}>
            <Pressable onPress={handleAvatarPress} style={styles.avatarPressable}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.avatarBorder}
              >
                <View style={styles.avatar}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={8} r={4} stroke={colors.gradient.start} strokeWidth={2} />
                      <Path d="M20 21a8 8 0 0 0-16 0" stroke={colors.gradient.start} strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  )}
                </View>
              </LinearGradient>
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Circle cx={12} cy={13} r={4} stroke="#FFFFFF" strokeWidth={2} />
                </Svg>
              </View>
            </Pressable>
            <Pressable onPress={handleUsernamePress} style={styles.userNamePressable}>
              <Text style={styles.userName}>{username}</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.editIcon}>
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Text style={styles.userTagline}>Tap name or photo to edit</Text>
          </View>

          {/* Stats Row with Glass Effect */}
          <View style={styles.statsRow}>
            {Platform.OS === 'ios' && (
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalUtilities.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Utilities</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{verifiedCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{categoryCount}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Appearance Settings */}
        {renderSectionTitle('Appearance')}
        <GlassCard style={styles.card} variant="elevated">
          <SettingItem
            icon="dark-mode"
            title="Dark Mode"
            description="Toggle dark/light theme"
            colorType="appearance"
            isDarkMode={isDarkMode}
            rightElement={
              <ModernSwitch value={isDarkMode} onValueChange={toggleTheme} />
            }
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <SettingItem
            icon="language"
            title="Language"
            description={getSelectedLanguageName()}
            colorType="language"
            isDarkMode={isDarkMode}
            onPress={() => setIsLanguageModalVisible(true)}
            showChevron
          />
        </GlassCard>

        {/* Notifications */}
        {renderSectionTitle('Notifications')}
        <GlassCard style={styles.card} variant="elevated">
          <SettingItem
            icon="notification"
            title="Push Notifications"
            description="Receive app notifications"
            colorType="notification"
            isDarkMode={isDarkMode}
            rightElement={
              <ModernSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
        </GlassCard>

        {/* Privacy Settings */}
        {renderSectionTitle('Privacy')}
        <GlassCard style={styles.card} variant="elevated">
          <SettingItem
            icon="location"
            title="Location Sharing"
            description={
              hasLocationPermission ? 'Location access granted' : 'Location access denied'
            }
            colorType="privacy"
            isDarkMode={isDarkMode}
            rightElement={
              <ModernSwitch
                value={locationSharing && hasLocationPermission}
                onValueChange={setLocationSharing}
                disabled={!hasLocationPermission}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <SettingItem
            icon="export"
            title="Export Data"
            description="Download your data"
            colorType="privacy"
            isDarkMode={isDarkMode}
            onPress={handleDataExport}
            showChevron
          />
        </GlassCard>

        {/* App Information */}
        {renderSectionTitle('Information')}
        <GlassCard style={styles.card} variant="elevated">
          <SettingItem
            icon="version"
            title="Version"
            description="1.0.0"
            colorType="info"
            isDarkMode={isDarkMode}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <SettingItem
            icon="shield"
            title="Privacy Policy"
            description="Read our privacy policy"
            colorType="info"
            isDarkMode={isDarkMode}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            showChevron
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <SettingItem
            icon="document"
            title="Terms of Service"
            description="Read our terms"
            colorType="info"
            isDarkMode={isDarkMode}
            onPress={() => navigation.navigate('TermsOfService')}
            showChevron
          />
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          <SettingItem
            icon="heart"
            title="About UrbanAid"
            description="Learn more about our mission"
            colorType="info"
            isDarkMode={isDarkMode}
            onPress={() =>
              Alert.alert(
                'About UrbanAid',
                'UrbanAid helps you find nearby public utilities to make urban living easier and more accessible for everyone.',
              )
            }
            showChevron
          />
        </GlassCard>

        {/* Storage */}
        {renderSectionTitle('Storage')}
        <GlassCard style={styles.card} variant="elevated">
          <SettingItem
            icon="storage"
            title="Clear Cache"
            description="Free up storage space"
            colorType="storage"
            isDarkMode={isDarkMode}
            onPress={handleClearCache}
            showChevron
          />
        </GlassCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.text.tertiary }]}>
            Made with 💜 for urban accessibility
          </Text>
          <Text style={[styles.footerVersion, { color: themeColors.text.tertiary }]}>
            UrbanAid v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Portal>
        <Modal
          visible={isLanguageModalVisible}
          onDismiss={() => setIsLanguageModalVisible(false)}
          contentContainerStyle={styles.modalWrapper}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                  Select Language
                </Text>

                <RadioButton.Group onValueChange={handleLanguageChange} value={selectedLanguage}>
                  {languages.map((language) => (
                    <Pressable
                      key={language.code}
                      style={[
                        styles.languageItem,
                        selectedLanguage === language.code && {
                          backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        },
                      ]}
                      onPress={() => handleLanguageChange(language.code)}
                    >
                      <View style={styles.languageInfo}>
                        <Text style={[styles.languageName, { color: themeColors.text.primary }]}>
                          {language.name}
                        </Text>
                        <Text
                          style={[styles.languageNative, { color: themeColors.text.secondary }]}
                        >
                          {language.nativeName}
                        </Text>
                      </View>
                      <RadioButton.Android
                        value={language.code}
                        color={colors.gradient.start}
                        uncheckedColor={themeColors.text.tertiary}
                      />
                    </Pressable>
                  ))}
                </RadioButton.Group>

                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsLanguageModalVisible(false)}
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
                Select Language
              </Text>

              <RadioButton.Group onValueChange={handleLanguageChange} value={selectedLanguage}>
                {languages.map((language) => (
                  <Pressable
                    key={language.code}
                    style={[
                      styles.languageItem,
                      selectedLanguage === language.code && {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                      },
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={[styles.languageName, { color: themeColors.text.primary }]}>
                        {language.name}
                      </Text>
                      <Text style={[styles.languageNative, { color: themeColors.text.secondary }]}>
                        {language.nativeName}
                      </Text>
                    </View>
                    <RadioButton.Android
                      value={language.code}
                      color={colors.gradient.start}
                      uncheckedColor={themeColors.text.tertiary}
                    />
                  </Pressable>
                ))}
              </RadioButton.Group>

              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setIsLanguageModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.gradient.start }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  ambientGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header Gradient - paddingTop set dynamically with insets.top
  headerGradient: {
    paddingBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPressable: {
    position: 'relative',
    marginBottom: tokens.spacing.md,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gradient.start,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userNamePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  userName: {
    fontSize: tokens.typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editIcon: {
    marginLeft: tokens.spacing.xs,
  },
  userTagline: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    color: 'rgba(255,255,255,0.8)',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: tokens.typography.labelMedium.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Section Title
  sectionTitle: {
    fontSize: tokens.typography.labelMedium.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },

  // Card
  card: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: tokens.typography.labelMedium.fontSize,
    marginTop: 2,
  },
  chevronSvg: {
    marginLeft: tokens.spacing.xs,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scale: 0.9 }] : [],
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },

  // Footer
  footer: {
    padding: tokens.spacing.xl,
    paddingBottom: tokens.sizes.tabBarHeight + tokens.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  footerVersion: {
    fontSize: tokens.typography.labelMedium.fontSize,
  },

  // Modal
  modalWrapper: {
    margin: tokens.spacing.lg,
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.xs,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    fontWeight: '500',
  },
  languageNative: {
    fontSize: tokens.typography.labelMedium.fontSize,
    marginTop: 2,
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
});

export default ProfileScreen;
