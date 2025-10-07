import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Utility, UtilityType } from '../types/utility';
import { getUtilityIcon } from '../utils/utilityHelpers';

interface UtilityMarkerProps {
  utility: Utility;
  size?: 'small' | 'medium' | 'large';
}

const UtilityMarkerComponent: React.FC<UtilityMarkerProps> = ({
  utility,
  size = 'medium',
}) => {
  const theme = useTheme();

  const markerConfig = useMemo(() => {
    const sizeMap = {
      small: { width: 32, height: 32, fontSize: 16 },
      medium: { width: 40, height: 40, fontSize: 20 },
      large: { width: 48, height: 48, fontSize: 24 },
    };

    return {
      size: sizeMap[size],
      color: utility.verified ? theme.colors.primary : theme.colors.secondary,
      icon: getUtilityIcon(utility.type || utility.category),
    };
  }, [size, utility.verified, utility.type, utility.category, theme.colors.primary, theme.colors.secondary]);

  const containerStyle = useMemo(() => [
    styles.container,
    {
      width: markerConfig.size.width,
      height: markerConfig.size.height,
      backgroundColor: markerConfig.color,
      borderColor: theme.colors.surface,
    },
  ], [markerConfig.size.width, markerConfig.size.height, markerConfig.color, theme.colors.surface]);

  const iconStyle = useMemo(() => [
    styles.icon,
    {
      fontSize: markerConfig.size.fontSize,
      color: theme.colors.onPrimary,
    },
  ], [markerConfig.size.fontSize, theme.colors.onPrimary]);

  const verifiedBadgeStyle = useMemo(() => [
    styles.verifiedBadge,
    { backgroundColor: theme.colors.tertiary },
  ], [theme.colors.tertiary]);

  const verifiedTextStyle = useMemo(() => [
    styles.verifiedText,
    { color: theme.colors.onTertiary },
  ], [theme.colors.onTertiary]);

  return (
    <View style={containerStyle}>
      <Text style={iconStyle}>
        {markerConfig.icon}
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

// Memoize the component to prevent unnecessary re-renders
export const UtilityMarker = memo(UtilityMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.utility.id === nextProps.utility.id &&
    prevProps.utility.verified === nextProps.utility.verified &&
    prevProps.utility.type === nextProps.utility.type &&
    prevProps.utility.category === nextProps.utility.category &&
    prevProps.size === nextProps.size
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    fontWeight: 'bold',
    textAlign: 'center',
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
  },
});
