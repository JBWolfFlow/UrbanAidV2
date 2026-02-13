/**
 * GlassTabBar - Glassmorphic Bottom Tab Bar
 * Replaces the default React Navigation tab bar with a frosted glass design
 * matching the app's purple-blue gradient design system.
 *
 * Uses the same BlurView pattern as GlassCard for consistency.
 * Android fallback: semi-transparent solid background.
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from 'react-native-paper';

import { colors } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

// Icon mapping for each route (mirrors TabIcon logic)
const ICON_MAP: Record<string, { focused: string; unfocused: string }> = {
  Map: { focused: 'map', unfocused: 'map-outline' },
  Search: { focused: 'magnify', unfocused: 'magnify' },
  Add: { focused: 'plus-circle', unfocused: 'plus-circle-outline' },
  Profile: { focused: 'account', unfocused: 'account-outline' },
};

const TAB_ICON_SIZE = 24;
const LABEL_FONT_SIZE = 11;
const INDICATOR_WIDTH = 4;
const INDICATOR_HEIGHT = 4;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

export const GlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const bottomPadding = Math.max(insets.bottom, 8);

  // Animated indicator position (tracks active tab index)
  const indicatorPosition = useSharedValue(state.index);

  // Update indicator when tab changes
  React.useEffect(() => {
    indicatorPosition.value = withSpring(state.index, SPRING_CONFIG);
  }, [state.index]);

  // Completely transparent — icons float with no visible background
  const glassConfig = useMemo(() => ({
    blur: 0,
    background: 'transparent',
    border: 'transparent',
    shadow: tokens.shadows.none,
  }), []);

  const containerHeight = tokens.sizes.tabBarHeight;

  // Always float for seamless glassmorphic look on all screens.
  // Non-map screens add bottom padding to their scroll containers.

  const renderTab = (route: typeof state.routes[number], index: number) => {
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const isFocused = state.index === index;

    const iconEntry = ICON_MAP[route.name] ?? { focused: 'help-circle', unfocused: 'help-circle-outline' };
    const iconName = isFocused ? iconEntry.focused : iconEntry.unfocused;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
        activeOpacity={0.7}
      >
        {/* Icon — gradient when focused, tertiary when not */}
        {isFocused ? (
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientIcon}
            >
              {/* We render the icon inside a masking View.
                  Since RN doesn't support true gradient text/icons,
                  we overlay the gradient and render icon on top. */}
            </LinearGradient>
            {/* Active icon rendered directly with gradient start color
                (true gradient masking requires MaskedView which is heavy) */}
            <View style={styles.iconAbsolute}>
              <Icon
                source={iconName}
                size={TAB_ICON_SIZE}
                color={colors.gradient.start}
              />
            </View>
          </View>
        ) : (
          <Icon
            source={iconName}
            size={TAB_ICON_SIZE}
            color={theme.text.tertiary}
          />
        )}

        {/* Label */}
        <Animated.Text
          style={[
            styles.label,
            {
              color: isFocused ? colors.gradient.start : theme.text.tertiary,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>

        {/* Gradient dot indicator for active tab */}
        {isFocused && (
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicator}
          />
        )}
      </TouchableOpacity>
    );
  };

  const tabBarContent = (
    <View
      style={[
        styles.tabRow,
        { paddingBottom: bottomPadding },
      ]}
    >
      {state.routes.map((route, index) => renderTab(route, index))}
    </View>
  );

  const floatingStyle = styles.floating;

  // Android: transparent floating icons (same as iOS)
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.container,
          floatingStyle,
          {
            height: containerHeight + bottomPadding,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {tabBarContent}
      </View>
    );
  }

  // iOS: true BlurView glassmorphism
  return (
    <View
      style={[
        styles.outerWrapper,
        floatingStyle,
        {
          height: containerHeight + bottomPadding,
          ...glassConfig.shadow,
        },
      ]}
    >
      {/* Blur layer — skip when intensity is 0 for pure transparency */}
      {glassConfig.blur > 0 && (
        <BlurView
          intensity={glassConfig.blur}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Glass tint overlay + top border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glassConfig.background,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: glassConfig.border,
          },
        ]}
      />

      {/* Tab content */}
      {tabBarContent}
    </View>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  outerWrapper: {
    overflow: 'hidden',
  },
  container: {
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrapper: {
    width: TAB_ICON_SIZE + 8,
    height: TAB_ICON_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientIcon: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    opacity: 0.15,
  },
  iconAbsolute: {
    position: 'absolute',
  },
  label: {
    fontSize: LABEL_FONT_SIZE,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    marginTop: 3,
  },
});

export default GlassTabBar;
