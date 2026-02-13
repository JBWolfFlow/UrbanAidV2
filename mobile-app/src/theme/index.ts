/**
 * UrbanAid V2 - Theme System Index
 * Exports all theme-related utilities and values
 */

export { colors, getUtilityColor } from './colors';
export type { ColorPalette, UtilityColorKey, AccentColorKey } from './colors';

export { tokens } from './tokens';
export type { Tokens, SpacingKey, RadiusKey, TypographyKey, ShadowKey } from './tokens';

// Re-export from theme.ts for backward compatibility
export { lightTheme, darkTheme, theme } from './theme';
