import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Appearance } from 'react-native';

interface ThemeState {
  isDarkMode: boolean;
  currentTheme: typeof MD3LightTheme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#FF9800',
    secondaryContainer: '#FFF3E0',
    tertiary: '#4CAF50',
    tertiaryContainer: '#E8F5E8',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#F44336',
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#616161',
    onBackground: '#212121',
    outline: '#E0E0E0',
    outlineVariant: '#EEEEEE',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#1976D2',
    secondary: '#FF9800',
    secondaryContainer: '#F57C00',
    tertiary: '#4CAF50',
    tertiaryContainer: '#388E3C',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    background: '#000000',
    error: '#F44336',
    errorContainer: '#B71C1C',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    onBackground: '#FFFFFF',
    outline: '#424242',
    outlineVariant: '#333333',
  },
};

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