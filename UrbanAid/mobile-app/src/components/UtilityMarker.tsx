import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Utility, UtilityType } from '../types/utility';

interface UtilityMarkerProps {
  utility: Utility;
  size?: 'small' | 'medium' | 'large';
}

export const UtilityMarker: React.FC<UtilityMarkerProps> = ({ 
  utility, 
  size = 'medium' 
}) => {
  const theme = useTheme();

  const getMarkerIcon = (type: UtilityType | string): string => {
    switch (type) {
      case 'water_fountain':
        return '💧';
      case 'restroom':
        return '🚻';
      case 'charging_station':
        return '🔌';
      case 'parking':
        return '🅿️';
      case 'wifi':
        return '📶';
      case 'atm':
        return '🏧';
      case 'phone_booth':
        return '📞';
      case 'bench':
        return '🪑';
      default:
        return '📍';
    }
  };

  const getMarkerSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: 16 };
      case 'medium':
        return { width: 40, height: 40, fontSize: 20 };
      case 'large':
        return { width: 48, height: 48, fontSize: 24 };
      default:
        return { width: 40, height: 40, fontSize: 20 };
    }
  };

  const markerSize = getMarkerSize();
  const markerColor = utility.verified 
    ? theme.colors.primary 
    : theme.colors.secondary;

  return (
    <View style={[
      styles.container,
      {
        width: markerSize.width,
        height: markerSize.height,
        backgroundColor: markerColor,
        borderColor: theme.colors.surface,
      }
    ]}>
      <Text 
        style={[
          styles.icon,
          { 
            fontSize: markerSize.fontSize,
            color: theme.colors.onPrimary 
          }
        ]}
      >
        {getMarkerIcon(utility.type || utility.category)}
      </Text>
      
      {utility.verified && (
        <View style={[
          styles.verifiedBadge,
          { backgroundColor: theme.colors.tertiary }
        ]}>
          <Text style={[
            styles.verifiedText,
            { color: theme.colors.onTertiary }
          ]}>
            ✓
          </Text>
        </View>
      )}
    </View>
  );
};

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