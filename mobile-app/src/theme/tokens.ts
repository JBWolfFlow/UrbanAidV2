/**
 * UrbanAid V2 - Design Tokens
 * Consistent spacing, typography, and component styling
 */

import { Platform } from 'react-native';

export const tokens = {
  // Spacing Scale (4px base unit)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Border Radius
  radius: {
    // Base scale
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    full: 9999,

    // Component-specific
    card: 24,
    cardLarge: 32,
    button: 16,
    buttonPill: 9999,
    input: 16,
    chip: 20,
    marker: 20,
    avatar: 9999,
    modal: 28,
    bottomSheet: 28,
    searchBar: 20,
    fab: 16,
  },

  // Glassmorphism Settings
  glass: {
    blur: {
      light: 10,      // Standard blur
      medium: 15,     // Enhanced blur
      heavy: 25,      // Frosted effect
    },
    backgroundOpacity: {
      subtle: 0.1,
      standard: 0.25,
      strong: 0.4,
    },
    borderOpacity: {
      subtle: 0.1,
      standard: 0.2,
      strong: 0.3,
    },
  },

  // Shadow Presets
  shadows: {
    // Glassmorphic shadows
    glass: {
      shadowColor: 'rgba(31, 38, 135, 0.37)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 8,
    },
    glassSubtle: {
      shadowColor: 'rgba(31, 38, 135, 0.2)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 4,
    },

    // Standard shadows
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },

    // Colored shadows
    primary: {
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    success: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    error: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // Typography Scale
  typography: {
    // Display - Hero text
    displayLarge: {
      fontSize: 48,
      fontWeight: '700' as const,
      lineHeight: 56,
      letterSpacing: -0.5,
    },
    displayMedium: {
      fontSize: 40,
      fontWeight: '700' as const,
      lineHeight: 48,
      letterSpacing: -0.25,
    },
    displaySmall: {
      fontSize: 32,
      fontWeight: '600' as const,
      lineHeight: 40,
      letterSpacing: 0,
    },

    // Headline - Section headers
    headlineLarge: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0,
    },

    // Title - Card/modal titles
    titleLarge: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0.1,
    },
    titleSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },

    // Body - Content text
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.4,
    },

    // Label - Buttons, chips, badges
    labelLarge: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
  },

  // Animation Durations
  animation: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
  },

  // Component Sizes
  sizes: {
    // Buttons
    buttonHeight: {
      sm: 36,
      md: 44,
      lg: 52,
    },

    // Icons
    icon: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40,
    },

    // Avatars
    avatar: {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    },

    // Map Markers
    marker: {
      sm: 32,
      md: 44,
      lg: 56,
    },

    // Input
    inputHeight: 52,

    // Tab Bar
    tabBarHeight: Platform.OS === 'ios' ? 88 : 72,

    // Bottom Sheet
    bottomSheetHandle: 4,
  },

  // Hit Slop for touch targets (accessibility)
  hitSlop: {
    small: { top: 8, bottom: 8, left: 8, right: 8 },
    medium: { top: 12, bottom: 12, left: 12, right: 12 },
    large: { top: 16, bottom: 16, left: 16, right: 16 },
  },
} as const;

// Type exports
export type Tokens = typeof tokens;
export type SpacingKey = keyof typeof tokens.spacing;
export type RadiusKey = keyof typeof tokens.radius;
export type TypographyKey = keyof typeof tokens.typography;
export type ShadowKey = keyof typeof tokens.shadows;
