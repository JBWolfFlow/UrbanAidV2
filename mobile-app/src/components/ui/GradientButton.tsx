/**
 * GradientButton - Modern Button with Gradient Background
 * Supports primary, secondary, and outlined variants with press animations
 */

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const opacity = interpolate(pressed.value, [0, 1], [1, 0.9]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const sizeConfig = useMemo(() => {
    const sizes = {
      sm: {
        height: tokens.sizes.buttonHeight.sm,
        paddingHorizontal: tokens.spacing.md,
        ...tokens.typography.labelMedium,
      },
      md: {
        height: tokens.sizes.buttonHeight.md,
        paddingHorizontal: tokens.spacing.lg,
        ...tokens.typography.labelLarge,
      },
      lg: {
        height: tokens.sizes.buttonHeight.lg,
        paddingHorizontal: tokens.spacing.xl,
        ...tokens.typography.titleSmall,
      },
    };
    return sizes[size];
  }, [size]);

  const variantConfig = useMemo(() => {
    const configs = {
      primary: {
        gradient: [colors.gradient.start, colors.gradient.end],
        textColor: '#FFFFFF',
        shadow: tokens.shadows.primary,
      },
      secondary: {
        gradient: [colors.gradientSecondary.start, colors.gradientSecondary.end],
        textColor: '#FFFFFF',
        shadow: tokens.shadows.md,
      },
      success: {
        gradient: [colors.gradientSuccess.start, colors.gradientSuccess.end],
        textColor: '#FFFFFF',
        shadow: tokens.shadows.success,
      },
      outlined: {
        gradient: null,
        textColor: colors.gradient.start,
        shadow: tokens.shadows.none,
        borderColor: colors.gradient.start,
      },
      ghost: {
        gradient: null,
        textColor: theme.text.primary,
        shadow: tokens.shadows.none,
      },
    };
    return configs[variant];
  }, [variant, theme]);

  const containerStyle = useMemo((): StyleProp<ViewStyle> => [
    styles.container,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: tokens.radius.button,
      ...(variantConfig.shadow || {}),
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    variant === 'outlined' && {
      borderWidth: 2,
      borderColor: 'borderColor' in variantConfig ? variantConfig.borderColor : colors.gradient.start,
      backgroundColor: 'transparent',
    },
    variant === 'ghost' && {
      backgroundColor: 'transparent',
    },
    style,
  ], [sizeConfig, variantConfig, fullWidth, disabled, variant, style]);

  const buttonTextStyle = useMemo((): StyleProp<TextStyle> => [
    styles.text,
    {
      color: variantConfig.textColor,
      fontSize: sizeConfig.fontSize,
      fontWeight: sizeConfig.fontWeight,
      letterSpacing: sizeConfig.letterSpacing,
    },
    textStyle,
  ], [variantConfig, sizeConfig, textStyle]);

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantConfig.textColor}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={buttonTextStyle}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  if (variant === 'outlined' || variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, containerStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, { borderRadius: tokens.radius.button }, fullWidth && styles.fullWidth]}
    >
      <LinearGradient
        colors={variantConfig.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={containerStyle}
      >
        {content}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: tokens.spacing.sm,
  },
  iconRight: {
    marginLeft: tokens.spacing.sm,
  },
});

export default GradientButton;
