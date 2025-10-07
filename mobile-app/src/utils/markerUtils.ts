import { Utility } from '../types/utility';

/**
 * Geographic regions that may have marker rendering issues
 */
const PROBLEMATIC_REGIONS = {
  PHOENIX: {
    name: 'Phoenix',
    bounds: {
      north: 33.7,
      south: 33.2,
      east: -111.8,
      west: -112.4
    }
  },
  CHICAGO: {
    name: 'Chicago',
    bounds: {
      north: 42.0,
      south: 41.6,
      east: -87.5,
      west: -87.9
    }
  }
};

/**
 * Check if a utility is in a problematic geographic region
 */
export const isInProblematicRegion = (utility: Utility): boolean => {
  const { latitude, longitude } = utility;
  
  return Object.values(PROBLEMATIC_REGIONS).some(region => {
    return (
      latitude >= region.bounds.south &&
      latitude <= region.bounds.north &&
      longitude >= region.bounds.west &&
      longitude <= region.bounds.east
    );
  });
};

/**
 * Get optimized marker props for utilities in problematic regions
 * Updated with more aggressive anti-flickering approach
 */
export const getOptimizedMarkerProps = (utility: Utility, isMarkerReady: boolean) => {
  const isProblematic = isInProblematicRegion(utility);
  
  // For ALL markers, use aggressive anti-flickering if they're ready
  // For problematic regions, always use false
  const shouldTrackChanges = isProblematic ? false : !isMarkerReady;
  
  return {
    // More aggressive anti-flickering
    tracksViewChanges: shouldTrackChanges,
    anchor: { x: 0.5, y: 0.5 },
    centerOffset: { x: 0, y: 0 },
    flat: false,
    rotation: 0,
    zIndex: isProblematic ? 10 : (utility.verified ? 2 : 1), // Higher z-index for problematic
    // Add stable identifier for debugging
    identifier: isProblematic ? `${utility.id}-stable` : utility.id,
    // Additional stabilization props
    stopPropagation: true,
  };
};

/**
 * Debounce function specifically for marker updates - more aggressive
 */
export const debounceMarkerUpdate = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 20 // Shorter delay for faster response
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Create a stable key for markers to prevent unnecessary re-renders
 */
export const createStableMarkerKey = (utility: Utility): string => {
  const isProblematic = isInProblematicRegion(utility);
  const suffix = isProblematic ? '-stable' : '';
  return `marker-${utility.id}${suffix}`;
};

/**
 * Check if marker should use immediate stable mode
 */
export const shouldUseImmediateStableMode = (utility: Utility): boolean => {
  // Use immediate stable mode for problematic regions or utilities with specific names
  const isProblematic = isInProblematicRegion(utility);
  const hasProblematicName = utility.name?.toLowerCase().includes('phoenix') || 
                            utility.name?.toLowerCase().includes('chicago') ||
                            utility.description?.toLowerCase().includes('phoenix') ||
                            utility.description?.toLowerCase().includes('chicago') ||
                            false;
  
  return isProblematic || !!hasProblematicName;
}; 