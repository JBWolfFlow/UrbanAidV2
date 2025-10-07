import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightColors = {
  primary: '#2196F3',
  primaryContainer: '#E3F2FD',
  secondary: '#4CAF50',
  secondaryContainer: '#E8F5E8',
  tertiary: '#FF9800',
  tertiaryContainer: '#FFF3E0',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  error: '#F44336',
  errorContainer: '#FFEBEE',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#0D47A1',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#2E7D32',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#E65100',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  onBackground: '#212121',
  onError: '#FFFFFF',
  onErrorContainer: '#C62828',
  outline: '#E0E0E0',
  outlineVariant: '#F5F5F5',
  inverseSurface: '#303030',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#90CAF9',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#F5F5F5',
  onSurfaceDisabled: '#BDBDBD',
};

const darkColors = {
  primary: '#90CAF9',
  primaryContainer: '#1565C0',
  secondary: '#81C784',
  secondaryContainer: '#388E3C',
  tertiary: '#FFB74D',
  tertiaryContainer: '#F57C00',
  surface: '#121212',
  surfaceVariant: '#1E1E1E',
  background: '#121212',
  error: '#CF6679',
  errorContainer: '#B71C1C',
  onPrimary: '#0D47A1',
  onPrimaryContainer: '#E3F2FD',
  onSecondary: '#2E7D32',
  onSecondaryContainer: '#E8F5E8',
  onTertiary: '#E65100',
  onTertiaryContainer: '#FFF3E0',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#BDBDBD',
  onBackground: '#FFFFFF',
  onError: '#FFFFFF',
  onErrorContainer: '#FFEBEE',
  outline: '#424242',
  outlineVariant: '#1E1E1E',
  inverseSurface: '#F5F5F5',
  inverseOnSurface: '#212121',
  inversePrimary: '#2196F3',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#1E1E1E',
  onSurfaceDisabled: '#616161',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};

export const theme = lightTheme; // Default theme 