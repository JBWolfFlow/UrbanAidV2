/**
 * ModernInput - Floating Label Input Component
 * Features animated floating labels and focus state with gradient border
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { tokens } from '../../theme/tokens';
import { useThemeStore } from '../../stores/themeStore';

const AnimatedText = Animated.createAnimatedComponent(Text);

export interface ModernInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  disabled = false,
  placeholder,
  ...textInputProps
}) => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const inputRef = useRef<TextInput>(null);

  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(value ? 1 : 0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnimation.value = withTiming(1, { duration: 200 });
  }, [focusAnimation]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) {
      focusAnimation.value = withTiming(0, { duration: 200 });
    }
  }, [focusAnimation, value]);

  const handlePress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, -26],
    );
    const scale = interpolate(
      focusAnimation.value,
      [0, 1],
      [1, 0.85],
    );
    const translateX = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, leftIcon ? -8 : 0],
    );

    return {
      transform: [
        { translateY },
        { scale },
        { translateX },
      ],
    };
  });

  const labelColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [theme.text.tertiary, isFocused ? colors.gradient.start : theme.text.secondary],
    );

    return { color };
  });

  const inputContainerStyle = useMemo((): StyleProp<ViewStyle> => [
    styles.inputContainer,
    {
      backgroundColor: theme.glass,
      borderColor: error ? colors.state.error : 'transparent',
      borderWidth: error ? 2 : 0,
    },
    disabled && styles.disabled,
  ], [error, disabled, theme.glass]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable onPress={handlePress}>
        {/* No gradient border outline */}
        <View style={inputContainerStyle}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={!disabled}
              style={[
                styles.input,
                {
                  color: theme.text.primary,
                },
                inputStyle,
              ]}
              placeholder={isFocused || value ? placeholder : ''}
              placeholderTextColor={theme.text.tertiary}
              selectionColor={colors.gradient.start}
              {...textInputProps}
            />
          </View>

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>

        {/* Floating label — rendered AFTER (on top of) gradient border + input */}
        <AnimatedText
          style={[
            styles.floatingLabel,
            { color: theme.text.tertiary },
            labelAnimatedStyle,
            labelColorStyle,
          ]}
        >
          {label}
        </AnimatedText>
      </Pressable>

      {(error || helper) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.state.error : theme.text.tertiary },
          ]}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  gradientBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    zIndex: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tokens.sizes.inputHeight,
    borderRadius: tokens.radius.input,
    paddingHorizontal: tokens.spacing.md,
    zIndex: 1,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  floatingLabel: {
    position: 'absolute',
    left: tokens.spacing.md,
    top: '50%',
    marginTop: -10,
    paddingHorizontal: 4,
    zIndex: 10,
    ...tokens.typography.bodyLarge,
  },
  input: {
    flex: 1,
    paddingTop: tokens.spacing.sm,
    ...tokens.typography.bodyLarge,
  },
  leftIcon: {
    marginRight: tokens.spacing.sm,
  },
  rightIcon: {
    marginLeft: tokens.spacing.sm,
  },
  helperText: {
    marginTop: tokens.spacing.xs,
    marginLeft: tokens.spacing.md,
    ...tokens.typography.bodySmall,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ModernInput;
