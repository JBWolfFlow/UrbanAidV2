/**
 * GlassCard - Glassmorphic Card Component
 * Creates a frosted glass effect with blur, transparency, and subtle borders
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'subtle' | 'standard' | 'strong';
  variant?: 'default' | 'elevated' | 'outlined';
  borderRadius?: number;
  padding?: number | 'none' | 'sm' | 'md' | 'lg';
  blurIntensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'standard',
  variant = 'default',
  borderRadius = tokens.radius.card,
  padding = 'md',
  blurIntensity,
}) => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const paddingValue = useMemo(() => {
    if (typeof padding === 'number') return padding;
    const paddingMap = {
      none: 0,
      sm: tokens.spacing.sm,
      md: tokens.spacing.md,
      lg: tokens.spacing.lg,
    };
    return paddingMap[padding];
  }, [padding]);

  const intensityConfig = useMemo(() => {
    const configs = {
      subtle: {
        blur: blurIntensity ?? tokens.glass.blur.light,
        background: isDarkMode ? 'rgba(30, 30, 46, 0.5)' : 'rgba(255, 255, 255, 0.15)',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)',
      },
      standard: {
        blur: blurIntensity ?? tokens.glass.blur.medium,
        background: isDarkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.25)',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
      },
      strong: {
        blur: blurIntensity ?? tokens.glass.blur.heavy,
        background: isDarkMode ? 'rgba(40, 40, 60, 0.9)' : 'rgba(255, 255, 255, 0.4)',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)',
      },
    };
    return configs[intensity];
  }, [intensity, isDarkMode, blurIntensity]);

  const containerStyle = useMemo((): StyleProp<ViewStyle> => [
    styles.container,
    {
      borderRadius,
      padding: paddingValue,
      borderColor: intensityConfig.border,
      borderWidth: variant === 'outlined' ? 1.5 : 1,
    },
    variant === 'elevated' && {
      ...tokens.shadows.glass,
    },
    style,
  ], [borderRadius, paddingValue, intensityConfig.border, variant, style]);

  // Android doesn't support BlurView well, use solid background
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          containerStyle,
          {
            backgroundColor: isDarkMode
              ? 'rgba(30, 30, 46, 0.95)'
              : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { borderRadius }]}>
      <BlurView
        intensity={intensityConfig.blur}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.blur, { borderRadius }]}
      />
      <View
        style={[
          containerStyle,
          { backgroundColor: intensityConfig.background },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    overflow: 'hidden',
  },
});

export default GlassCard;
