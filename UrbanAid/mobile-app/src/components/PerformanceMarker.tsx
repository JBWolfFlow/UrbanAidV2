import React, { memo, useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Utility, UtilityType } from '../types/utility';
import { getUtilityIcon } from '../utils/utilityHelpers';

interface PerformanceMarkerProps {
  utility: Utility;
  size?: 'small' | 'medium' | 'large';
  theme: any;
  onMarkerReady?: () => void;
}

const PerformanceMarkerComponent: React.FC<PerformanceMarkerProps> = ({ 
  utility, 
  size = 'medium',
  theme,
  onMarkerReady
}) => {
  // Immediately signal that marker is ready after mounting
  useEffect(() => {
    // Use immediate timeout to signal marker is ready
    const timer = setTimeout(() => {
      onMarkerReady?.();
    }, 50); // Much shorter timeout
    
    return () => clearTimeout(timer);
  }, [onMarkerReady]);

  // Static size mapping
  const sizeMap = useMemo(() => ({
    small: { width: 32, height: 32, fontSize: 16 },
    medium: { width: 40, height: 40, fontSize: 20 },
    large: { width: 48, height: 48, fontSize: 24 },
  }), []);

  // Compute all marker properties once using the comprehensive icon helper
  const markerProps = useMemo(() => {
    const sizeProps = sizeMap[size];
    // Use the comprehensive icon mapping from utilityHelpers
    const icon = getUtilityIcon(utility.type || utility.category);
    const backgroundColor = utility.verified ? theme.colors.primary : theme.colors.secondary;
    
    return {
      size: sizeProps,
      icon,
      backgroundColor,
      borderColor: theme.colors.surface,
      iconColor: theme.colors.onPrimary,
      verifiedBadgeColor: theme.colors.tertiary,
      verifiedTextColor: theme.colors.onTertiary,
    };
  }, [
    size, 
    utility.type, 
    utility.category,
    utility.verified, 
    theme.colors.primary, 
    theme.colors.secondary, 
    theme.colors.surface,
    theme.colors.onPrimary,
    theme.colors.tertiary,
    theme.colors.onTertiary,
    sizeMap
  ]);

  // Pre-computed styles to avoid inline style objects
  const containerStyle = useMemo(() => [
    styles.container,
    {
      width: markerProps.size.width,
      height: markerProps.size.height,
      backgroundColor: markerProps.backgroundColor,
      borderColor: markerProps.borderColor,
    }
  ], [markerProps]);

  const iconStyle = useMemo(() => [
    styles.icon,
    {
      fontSize: markerProps.size.fontSize,
      color: markerProps.iconColor,
    }
  ], [markerProps]);

  const verifiedBadgeStyle = useMemo(() => [
    styles.verifiedBadge,
    { backgroundColor: markerProps.verifiedBadgeColor }
  ], [markerProps.verifiedBadgeColor]);

  const verifiedTextStyle = useMemo(() => [
    styles.verifiedText,
    { color: markerProps.verifiedTextColor }
  ], [markerProps.verifiedTextColor]);

  return (
    <View style={containerStyle}>
      <Text style={iconStyle}>
        {markerProps.icon}
      </Text>
      
      {utility.verified && (
        <View style={verifiedBadgeStyle}>
          <Text style={verifiedTextStyle}>
            ✓
          </Text>
        </View>
      )}
    </View>
  );
};

// Custom comparison function for maximum performance
const areEqual = (prevProps: PerformanceMarkerProps, nextProps: PerformanceMarkerProps): boolean => {
  const prev = prevProps.utility;
  const next = nextProps.utility;
  
  return (
    prev.id === next.id &&
    prev.verified === next.verified &&
    prev.type === next.type &&
    prev.category === next.category &&
    prevProps.size === nextProps.size &&
    // Only check theme colors that actually affect the marker
    prevProps.theme.colors.primary === nextProps.theme.colors.primary &&
    prevProps.theme.colors.secondary === nextProps.theme.colors.secondary &&
    prevProps.theme.colors.surface === nextProps.theme.colors.surface &&
    prevProps.theme.colors.onPrimary === nextProps.theme.colors.onPrimary &&
    prevProps.theme.colors.tertiary === nextProps.theme.colors.tertiary &&
    prevProps.theme.colors.onTertiary === nextProps.theme.colors.onTertiary
  );
};

export const PerformanceMarker = memo(PerformanceMarkerComponent, areEqual);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Remove shadows that might cause flickering
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  icon: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
}); 