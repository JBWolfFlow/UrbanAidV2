/**
 * UrbanAid V2 - Theme Configuration
 * React Native Paper MD3 theme with glassmorphic design system
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';
import { tokens } from './tokens';

/**
 * Light theme colors - mapped to Paper's color scheme
 */
const lightColors = {
  // Primary colors (gradient-based)
  primary: colors.gradient.start,
  primaryContainer: colors.light.backgroundSecondary,
  onPrimary: '#FFFFFF',
  onPrimaryContainer: colors.gradient.end,

  // Secondary colors (coral accent)
  secondary: colors.accent.coral,
  secondaryContainer: 'rgba(255, 107, 107, 0.15)',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: colors.accent.coral,

  // Tertiary colors (mint accent)
  tertiary: colors.accent.mint,
  tertiaryContainer: 'rgba(46, 213, 115, 0.15)',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: colors.accent.mint,

  // Surfaces
  surface: colors.light.surface,
  surfaceVariant: colors.light.backgroundSecondary,
  background: colors.light.background,

  // Text colors
  onSurface: colors.light.text.primary,
  onSurfaceVariant: colors.light.text.secondary,
  onBackground: colors.light.text.primary,

  // Error colors
  error: colors.state.error,
  errorContainer: 'rgba(239, 68, 68, 0.1)',
  onError: '#FFFFFF',
  onErrorContainer: colors.state.error,

  // Outlines
  outline: colors.light.glassBorder,
  outlineVariant: colors.light.divider,

  // Inverse colors
  inverseSurface: colors.dark.surface,
  inverseOnSurface: colors.dark.text.primary,
  inversePrimary: colors.gradient.start,

  // Misc colors
  shadow: 'rgba(31, 38, 135, 0.37)',
  scrim: colors.light.overlay,
  surfaceDisabled: colors.light.glass,
  onSurfaceDisabled: colors.light.text.tertiary,
};

/**
 * Dark theme colors - mapped to Paper's color scheme
 */
const darkColors = {
  // Primary colors (gradient-based)
  primary: colors.gradient.start,
  primaryContainer: colors.dark.surfaceElevated,
  onPrimary: '#FFFFFF',
  onPrimaryContainer: colors.gradient.start,

  // Secondary colors (coral accent)
  secondary: colors.accent.coral,
  secondaryContainer: 'rgba(255, 107, 107, 0.2)',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: colors.accent.coral,

  // Tertiary colors (mint accent)
  tertiary: colors.accent.mint,
  tertiaryContainer: 'rgba(46, 213, 115, 0.2)',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: colors.accent.mint,

  // Surfaces
  surface: colors.dark.surface,
  surfaceVariant: colors.dark.surfaceElevated,
  background: colors.dark.background,

  // Text colors
  onSurface: colors.dark.text.primary,
  onSurfaceVariant: colors.dark.text.secondary,
  onBackground: colors.dark.text.primary,

  // Error colors
  error: colors.state.error,
  errorContainer: 'rgba(239, 68, 68, 0.15)',
  onError: '#FFFFFF',
  onErrorContainer: colors.state.error,

  // Outlines
  outline: colors.dark.glassBorder,
  outlineVariant: colors.dark.divider,

  // Inverse colors
  inverseSurface: colors.light.surface,
  inverseOnSurface: colors.light.text.primary,
  inversePrimary: colors.gradient.end,

  // Misc colors
  shadow: colors.dark.glassShadow,
  scrim: colors.dark.overlay,
  surfaceDisabled: colors.dark.glass,
  onSurfaceDisabled: colors.dark.text.tertiary,
};

/**
 * Light theme with extended glassmorphic properties
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
    elevation: {
      level0: 'transparent',
      level1: colors.light.surface,
      level2: colors.light.backgroundSecondary,
      level3: colors.light.glass,
      level4: colors.light.glassStrong,
      level5: colors.light.glassStrong,
    },
  },
  // Custom extensions
  custom: {
    colors: colors.light,
    gradient: colors.gradient,
    accent: colors.accent,
    utilities: colors.utilities,
    state: colors.state,
  },
  tokens,
};

/**
 * Dark theme with extended glassmorphic properties
 */
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    elevation: {
      level0: 'transparent',
      level1: colors.dark.surface,
      level2: colors.dark.surfaceElevated,
      level3: colors.dark.glass,
      level4: colors.dark.glassStrong,
      level5: colors.dark.glassStrong,
    },
  },
  // Custom extensions
  custom: {
    colors: colors.dark,
    gradient: colors.gradient,
    accent: colors.accent,
    utilities: colors.utilities,
    state: colors.state,
  },
  tokens,
};

// Default theme export
export const theme = lightTheme;
