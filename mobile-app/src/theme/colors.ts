/**
 * UrbanAid V2 - Modern Glassmorphic Color Palette
 * 2026 Design Trends: Purple-to-blue gradients, glassmorphic effects
 */

export const colors = {
  // Primary Gradient (Purple to Blue - trending 2026)
  gradient: {
    start: '#667eea',   // Soft indigo
    end: '#764ba2',     // Rich purple
    accent: '#5352ED',  // Electric purple
  },

  // Secondary Gradients
  gradientSecondary: {
    start: '#f093fb',   // Soft pink
    end: '#f5576c',     // Coral
  },

  gradientSuccess: {
    start: '#11998e',   // Teal
    end: '#38ef7d',     // Mint
  },

  // Accent Colors
  accent: {
    coral: '#FF6B6B',       // Vibrant CTAs
    mint: '#2ED573',        // Success states
    electric: '#5352ED',    // Links & interactive
    amber: '#F59E0B',       // Warnings
    rose: '#F43F5E',        // Errors
    cyan: '#06B6D4',        // Info
  },

  // Light Mode
  light: {
    background: '#F8FAFF',           // Soft blue-tinted white
    backgroundSecondary: '#EEF2FF',  // Slightly darker for cards
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Glassmorphism
    glass: 'rgba(255, 255, 255, 0.25)',
    glassStrong: 'rgba(255, 255, 255, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassShadow: 'rgba(31, 38, 135, 0.37)',

    // Text
    text: {
      primary: '#1A1A2E',
      secondary: '#4A4A6A',
      tertiary: '#8B8BA3',
      inverse: '#FFFFFF',
    },

    // Semantic
    divider: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    shimmer: 'rgba(255, 255, 255, 0.8)',
  },

  // Dark Mode
  dark: {
    background: '#0F0F1A',           // Deep space black
    backgroundSecondary: '#16213E', // Navy
    surface: '#1A1A2E',
    surfaceElevated: '#242448',

    // Glassmorphism
    glass: 'rgba(30, 30, 46, 0.8)',
    glassStrong: 'rgba(40, 40, 60, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: 'rgba(0, 0, 0, 0.5)',

    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#B8B8D1',
      tertiary: '#6B6B8A',
      inverse: '#1A1A2E',
    },

    // Semantic
    divider: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shimmer: 'rgba(255, 255, 255, 0.1)',
  },

  // Utility Type Colors (for map markers and categorization)
  utilities: {
    water_fountain: {
      primary: '#3B82F6',      // Blue
      light: '#DBEAFE',
      dark: '#1E40AF',
    },
    restroom: {
      primary: '#8B5CF6',      // Purple
      light: '#EDE9FE',
      dark: '#5B21B6',
    },
    charging_station: {
      primary: '#F59E0B',      // Amber
      light: '#FEF3C7',
      dark: '#B45309',
    },
    shelter: {
      primary: '#F97316',      // Orange
      light: '#FFEDD5',
      dark: '#C2410C',
    },
    food: {
      primary: '#22C55E',      // Green
      light: '#DCFCE7',
      dark: '#15803D',
    },
    health: {
      primary: '#EF4444',      // Red
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    wifi: {
      primary: '#06B6D4',      // Cyan
      light: '#CFFAFE',
      dark: '#0891B2',
    },
    library: {
      primary: '#A855F7',      // Violet
      light: '#F3E8FF',
      dark: '#7C3AED',
    },
    transit: {
      primary: '#64748B',      // Slate
      light: '#F1F5F9',
      dark: '#475569',
    },
    bench: {
      primary: '#84CC16',      // Lime
      light: '#ECFCCB',
      dark: '#4D7C0F',
    },
    clinic: {
      primary: '#EC4899',      // Pink
      light: '#FCE7F3',
      dark: '#BE185D',
    },
    handwashing: {
      primary: '#14B8A6',      // Teal
      light: '#CCFBF1',
      dark: '#0F766E',
    },
    va_facility: {
      primary: '#7C3AED',      // Violet — military/veteran
      light: '#EDE9FE',
      dark: '#5B21B6',
    },
    usda: {
      primary: '#65A30D',      // Green — agriculture
      light: '#ECFCCB',
      dark: '#4D7C0F',
    },
    shower: {
      primary: '#0EA5E9',      // Sky blue
      light: '#E0F2FE',
      dark: '#0369A1',
    },
    laundry: {
      primary: '#8B5CF6',      // Violet
      light: '#EDE9FE',
      dark: '#6D28D9',
    },
    legal: {
      primary: '#6366F1',      // Indigo
      light: '#E0E7FF',
      dark: '#4338CA',
    },
    social_services: {
      primary: '#0891B2',      // Cyan
      light: '#CFFAFE',
      dark: '#0E7490',
    },
    job_training: {
      primary: '#D97706',      // Amber
      light: '#FEF3C7',
      dark: '#B45309',
    },
    mental_health: {
      primary: '#EC4899',      // Pink
      light: '#FCE7F3',
      dark: '#BE185D',
    },
    warming_center: {
      primary: '#EF4444',      // Red
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    cooling_center: {
      primary: '#06B6D4',      // Cyan
      light: '#CFFAFE',
      dark: '#0891B2',
    },
    clothing: {
      primary: '#F472B6',      // Pink
      light: '#FCE7F3',
      dark: '#DB2777',
    },
    needle_exchange: {
      primary: '#DC2626',      // Red
      light: '#FEE2E2',
      dark: '#991B1B',
    },
    pet_services: {
      primary: '#A3E635',      // Lime
      light: '#ECFCCB',
      dark: '#65A30D',
    },
    baby_needs: {
      primary: '#FB923C',      // Orange
      light: '#FFEDD5',
      dark: '#EA580C',
    },
    dental: {
      primary: '#2DD4BF',      // Teal
      light: '#CCFBF1',
      dark: '#0D9488',
    },
    eye_care: {
      primary: '#818CF8',      // Indigo
      light: '#E0E7FF',
      dark: '#6366F1',
    },
    haircut: {
      primary: '#F59E0B',      // Amber
      light: '#FEF3C7',
      dark: '#D97706',
    },
    tax_help: {
      primary: '#64748B',      // Slate
      light: '#F1F5F9',
      dark: '#475569',
    },
    parking: {
      primary: '#475569',      // Slate dark
      light: '#F1F5F9',
      dark: '#334155',
    },
    disaster_relief: {
      primary: '#DC2626',      // Red
      light: '#FEE2E2',
      dark: '#991B1B',
    },
  },

  // State Colors
  state: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

// Type exports for TypeScript support
export type ColorPalette = typeof colors;
export type UtilityColorKey = keyof typeof colors.utilities;
export type AccentColorKey = keyof typeof colors.accent;

/**
 * Get utility color by type name.
 * Supports exact match, then prefix matching for va_*, usda_*, and health_center variants.
 */
export function getUtilityColor(type: string): { primary: string; light: string; dark: string } {
  const normalizedType = type.toLowerCase().replace(/[\s-]/g, '_') as UtilityColorKey;

  // Exact match first
  if (colors.utilities[normalizedType]) {
    return colors.utilities[normalizedType];
  }

  // Prefix matching for grouped categories
  const lower = normalizedType as string;
  if (lower.startsWith('va_')) return colors.utilities.va_facility;
  if (lower.startsWith('usda_')) return colors.utilities.usda;
  if (lower.includes('health_center') || lower.startsWith('community_health') ||
      lower.startsWith('migrant_health') || lower.startsWith('homeless_health') ||
      lower.startsWith('public_housing_health') || lower.startsWith('school_based_health') ||
      lower.startsWith('federally_qualified')) return colors.utilities.health;
  if (lower === 'free_food') return colors.utilities.food;
  if (lower === 'safe_injection') return colors.utilities.needle_exchange;
  if (lower === 'hurricane_shelter') return colors.utilities.warming_center;
  if (lower === 'addiction_services' || lower === 'suicide_prevention' ||
      lower === 'domestic_violence') return colors.utilities.mental_health;

  // Default fallback
  return colors.utilities.water_fountain;
}
