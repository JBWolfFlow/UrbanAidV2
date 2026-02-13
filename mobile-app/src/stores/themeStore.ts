import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { Appearance } from 'react-native';
import { colors } from '../theme/colors';
import { tokens } from '../theme/tokens';

/**
 * Extended theme type that includes our custom properties
 */
interface ExtendedTheme extends MD3Theme {
  custom: {
    colors: typeof colors.light | typeof colors.dark;
    gradient: typeof colors.gradient;
    accent: typeof colors.accent;
    utilities: typeof colors.utilities;
    state: typeof colors.state;
  };
  tokens: typeof tokens;
}

interface ThemeState {
  isDarkMode: boolean;
  currentTheme: ExtendedTheme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

/**
 * Create light theme with Paper + custom glassmorphic design
 */
const createLightTheme = (): ExtendedTheme => ({
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Map primary colors to gradient
    primary: colors.gradient.start,
    primaryContainer: colors.light.backgroundSecondary,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.gradient.end,

    // Secondary uses coral accent
    secondary: colors.accent.coral,
    secondaryContainer: 'rgba(255, 107, 107, 0.15)',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.accent.coral,

    // Tertiary uses mint accent
    tertiary: colors.accent.mint,
    tertiaryContainer: 'rgba(46, 213, 115, 0.15)',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.accent.mint,

    // Surfaces
    surface: colors.light.surface,
    surfaceVariant: colors.light.backgroundSecondary,
    background: colors.light.background,

    // Text
    onSurface: colors.light.text.primary,
    onSurfaceVariant: colors.light.text.secondary,
    onBackground: colors.light.text.primary,

    // Error
    error: colors.state.error,
    errorContainer: 'rgba(239, 68, 68, 0.1)',
    onError: '#FFFFFF',
    onErrorContainer: colors.state.error,

    // Outlines
    outline: colors.light.glassBorder,
    outlineVariant: colors.light.divider,

    // Inverse
    inverseSurface: colors.dark.surface,
    inverseOnSurface: colors.dark.text.primary,
    inversePrimary: colors.gradient.start,

    // Misc
    shadow: 'rgba(31, 38, 135, 0.37)',
    scrim: colors.light.overlay,
    surfaceDisabled: colors.light.glass,
    onSurfaceDisabled: colors.light.text.tertiary,

    // Elevation (for Paper components)
    elevation: {
      level0: 'transparent',
      level1: colors.light.surface,
      level2: colors.light.backgroundSecondary,
      level3: colors.light.glass,
      level4: colors.light.glassStrong,
      level5: colors.light.glassStrong,
    },
  },
  custom: {
    colors: colors.light,
    gradient: colors.gradient,
    accent: colors.accent,
    utilities: colors.utilities,
    state: colors.state,
  },
  tokens,
});

/**
 * Create dark theme with Paper + custom glassmorphic design
 */
const createDarkTheme = (): ExtendedTheme => ({
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Map primary colors to gradient
    primary: colors.gradient.start,
    primaryContainer: colors.dark.surfaceElevated,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.gradient.start,

    // Secondary uses coral accent
    secondary: colors.accent.coral,
    secondaryContainer: 'rgba(255, 107, 107, 0.2)',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.accent.coral,

    // Tertiary uses mint accent
    tertiary: colors.accent.mint,
    tertiaryContainer: 'rgba(46, 213, 115, 0.2)',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.accent.mint,

    // Surfaces
    surface: colors.dark.surface,
    surfaceVariant: colors.dark.surfaceElevated,
    background: colors.dark.background,

    // Text
    onSurface: colors.dark.text.primary,
    onSurfaceVariant: colors.dark.text.secondary,
    onBackground: colors.dark.text.primary,

    // Error
    error: colors.state.error,
    errorContainer: 'rgba(239, 68, 68, 0.15)',
    onError: '#FFFFFF',
    onErrorContainer: colors.state.error,

    // Outlines
    outline: colors.dark.glassBorder,
    outlineVariant: colors.dark.divider,

    // Inverse
    inverseSurface: colors.light.surface,
    inverseOnSurface: colors.light.text.primary,
    inversePrimary: colors.gradient.end,

    // Misc
    shadow: colors.dark.glassShadow,
    scrim: colors.dark.overlay,
    surfaceDisabled: colors.dark.glass,
    onSurfaceDisabled: colors.dark.text.tertiary,

    // Elevation (for Paper components)
    elevation: {
      level0: 'transparent',
      level1: colors.dark.surface,
      level2: colors.dark.surfaceElevated,
      level3: colors.dark.glass,
      level4: colors.dark.glassStrong,
      level5: colors.dark.glassStrong,
    },
  },
  custom: {
    colors: colors.dark,
    gradient: colors.gradient,
    accent: colors.accent,
    utilities: colors.utilities,
    state: colors.state,
  },
  tokens,
});

// Precompute themes
const lightTheme = createLightTheme();
const darkTheme = createDarkTheme();

/**
 * Theme store for managing app theme state
 * Persists theme preference to AsyncStorage
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: Appearance.getColorScheme() === 'dark',
      currentTheme: Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme,

      /**
       * Toggle between light and dark themes
       */
      toggleTheme: () => {
        const { isDarkMode } = get();
        const newIsDarkMode = !isDarkMode;
        set({
          isDarkMode: newIsDarkMode,
          currentTheme: newIsDarkMode ? darkTheme : lightTheme,
        });
      },

      /**
       * Set theme to light or dark
       * @param isDark - Whether to use dark mode
       */
      setTheme: (isDark: boolean) => {
        set({
          isDarkMode: isDark,
          currentTheme: isDark ? darkTheme : lightTheme,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { setTheme } = useThemeStore.getState();
  setTheme(colorScheme === 'dark');
});

/**
 * Hook to access custom theme properties
 * Use this when you need glassmorphic colors and tokens
 */
export const useCustomTheme = () => {
  const { currentTheme, isDarkMode } = useThemeStore();
  return {
    ...currentTheme.custom,
    isDarkMode,
    tokens: currentTheme.tokens,
  };
};

/**
 * Get utility color by type
 */
export const getUtilityThemeColor = (type: string) => {
  const normalizedType = type.toLowerCase().replace(/[\s-]/g, '_');
  return colors.utilities[normalizedType as keyof typeof colors.utilities] || colors.utilities.water_fountain;
};

// Export theme references for backward compatibility
export { lightTheme, darkTheme };
