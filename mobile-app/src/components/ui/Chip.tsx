/**
 * Chip - Modern Pill-shaped Filter/Tag Component
 * Supports selectable states with utility-specific colors
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors, getUtilityColor } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'utility' | 'outlined' | 'filled';
  utilityType?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showCheckmark?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = 'default',
  utilityType,
  size = 'md',
  icon,
  disabled = false,
  style,
  textStyle,
  showCheckmark = false,
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
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    return { transform: [{ scale }] };
  });

  const sizeConfig = useMemo(() => {
    const sizes = {
      sm: {
        height: 28,
        paddingHorizontal: tokens.spacing.sm,
        ...tokens.typography.labelSmall,
        iconSize: 14,
      },
      md: {
        height: 36,
        paddingHorizontal: tokens.spacing.md,
        ...tokens.typography.labelMedium,
        iconSize: 16,
      },
      lg: {
        height: 44,
        paddingHorizontal: tokens.spacing.lg,
        ...tokens.typography.labelLarge,
        iconSize: 18,
      },
    };
    return sizes[size];
  }, [size]);

  const utilityColor = useMemo(() => {
    if (variant === 'utility' && utilityType) {
      return getUtilityColor(utilityType);
    }
    return null;
  }, [variant, utilityType]);

  const chipColors = useMemo(() => {
    if (variant === 'utility' && utilityColor) {
      return {
        background: selected ? utilityColor.primary : isDarkMode ? utilityColor.dark : utilityColor.light,
        text: selected ? '#FFFFFF' : utilityColor.primary,
        border: utilityColor.primary,
      };
    }

    if (variant === 'filled') {
      return {
        background: selected ? colors.gradient.start : theme.glass,
        text: selected ? '#FFFFFF' : theme.text.primary,
        border: 'transparent',
      };
    }

    if (variant === 'outlined') {
      return {
        background: selected ? colors.gradient.start : 'transparent',
        text: selected ? '#FFFFFF' : theme.text.primary,
        border: selected ? colors.gradient.start : theme.glassBorder,
      };
    }

    // default
    return {
      background: selected ? colors.gradient.start : theme.glass,
      text: selected ? '#FFFFFF' : theme.text.secondary,
      border: selected ? colors.gradient.start : theme.glassBorder,
    };
  }, [variant, utilityColor, selected, theme, isDarkMode]);

  const containerStyle = useMemo((): StyleProp<ViewStyle> => [
    styles.container,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      backgroundColor: chipColors.background,
      borderColor: chipColors.border,
      borderWidth: variant === 'outlined' || variant === 'default' ? 1 : 0,
    },
    disabled && styles.disabled,
    style,
  ], [sizeConfig, chipColors, variant, disabled, style]);

  const chipTextStyle = useMemo((): StyleProp<TextStyle> => [
    styles.text,
    {
      color: chipColors.text,
      fontSize: sizeConfig.fontSize,
      fontWeight: sizeConfig.fontWeight,
      letterSpacing: sizeConfig.letterSpacing,
    },
    textStyle,
  ], [chipColors, sizeConfig, textStyle]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[animatedStyle, containerStyle]}
    >
      {showCheckmark && selected && (
        <View style={styles.checkmark}>
          <Text style={[styles.checkmarkIcon, { color: chipColors.text }]}>
            ✓
          </Text>
        </View>
      )}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={chipTextStyle} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.chip,
  },
  text: {
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: tokens.spacing.xs,
  },
  checkmark: {
    marginRight: tokens.spacing.xs,
  },
  checkmarkIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Chip;
