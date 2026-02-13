/**
 * Skeleton - Loading Placeholder with Shimmer Animation
 * Provides visual feedback during content loading
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
  DimensionValue,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'image' | 'button' | 'custom';
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  lines?: number;
  lineSpacing?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  style,
  animated = true,
  lines = 1,
  lineSpacing = tokens.spacing.sm,
}) => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [animated, shimmerPosition]);

  const variantConfig = useMemo(() => {
    const configs = {
      text: {
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: borderRadius ?? tokens.radius.sm,
      },
      title: {
        width: width ?? '70%',
        height: height ?? 24,
        borderRadius: borderRadius ?? tokens.radius.sm,
      },
      avatar: {
        width: width ?? tokens.sizes.avatar.md,
        height: height ?? tokens.sizes.avatar.md,
        borderRadius: borderRadius ?? tokens.radius.full,
      },
      card: {
        width: width ?? '100%',
        height: height ?? 120,
        borderRadius: borderRadius ?? tokens.radius.card,
      },
      image: {
        width: width ?? '100%',
        height: height ?? 200,
        borderRadius: borderRadius ?? tokens.radius.lg,
      },
      button: {
        width: width ?? '100%',
        height: height ?? tokens.sizes.buttonHeight.md,
        borderRadius: borderRadius ?? tokens.radius.button,
      },
      custom: {
        width: width ?? '100%',
        height: height ?? 48,
        borderRadius: borderRadius ?? tokens.radius.md,
      },
    };
    return configs[variant];
  }, [variant, width, height, borderRadius]);

  const shimmerColors = useMemo(() => {
    const baseColor = isDarkMode
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.06)';
    const shimmerColor = isDarkMode
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.8)';

    return [baseColor, shimmerColor, baseColor];
  }, [isDarkMode]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const containerStyle = useMemo((): StyleProp<ViewStyle> => [
    styles.container,
    {
      width: variantConfig.width as DimensionValue,
      height: variantConfig.height,
      borderRadius: variantConfig.borderRadius,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.06)',
    },
    style,
  ], [variantConfig, isDarkMode, style]);

  const renderSingleSkeleton = (key?: number) => (
    <View key={key} style={containerStyle}>
      {animated && (
        <Animated.View style={[styles.shimmer, animatedStyle]}>
          <LinearGradient
            colors={shimmerColors as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      )}
    </View>
  );

  if (variant === 'text' && lines > 1) {
    return (
      <View style={styles.linesContainer}>
        {Array.from({ length: lines }).map((_, index) => (
          <View
            key={index}
            style={[
              containerStyle,
              { marginBottom: index < lines - 1 ? lineSpacing : 0 },
              index === lines - 1 && { width: '75%' as const },
            ]}
          >
            {animated && (
              <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                  colors={shimmerColors as [string, string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradient}
                />
              </Animated.View>
            )}
          </View>
        ))}
      </View>
    );
  }

  return renderSingleSkeleton();
};

/**
 * Pre-built skeleton layouts for common use cases
 */
export const SkeletonCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[skeletonCardStyles.container, style]}>
      <View style={skeletonCardStyles.header}>
        <Skeleton variant="avatar" width={40} height={40} />
        <View style={skeletonCardStyles.headerText}>
          <Skeleton variant="title" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton variant="text" lines={3} style={{ marginTop: 12 }} />
    </View>
  );
};

export const SkeletonListItem: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[skeletonListStyles.container, style]}>
      <Skeleton variant="avatar" width={48} height={48} />
      <View style={skeletonListStyles.content}>
        <Skeleton variant="title" width="70%" height={16} />
        <Skeleton variant="text" width="90%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  linesContainer: {
    width: '100%',
  },
});

const skeletonCardStyles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
});

const skeletonListStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
  content: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
});

export default Skeleton;
