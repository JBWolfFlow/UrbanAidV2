import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Utility } from '../types/utility';
import { getUtilityVectorIcon } from '../utils/utilityHelpers';
import { getUtilityColor } from '../theme/colors';

interface UtilityMarkerProps {
  utility: Utility;
  size?: 'small' | 'medium' | 'large';
  isSelected?: boolean;
}

/**
 * Small colored dot — used for 3,600+ bulk markers.
 * No icon font, no pointer — just a colored circle with white border.
 * Snapshots instantly via tracksViewChanges={false}.
 */
export const UtilityDot = memo<{ utility: Utility }>(({ utility }) => {
  const utilityType = utility.type || utility.category || 'water_fountain';
  const bg = getUtilityColor(utilityType).primary;

  return (
    <View style={[styles.dot, { backgroundColor: bg }]} />
  );
}, (prev, next) => (
  prev.utility.id === next.utility.id &&
  prev.utility.category === next.utility.category
));

const SIZES = {
  small:  { circle: 28, icon: 14, border: 1.5, pointer: 6, glow: 8 },
  medium: { circle: 34, icon: 18, border: 2,   pointer: 8, glow: 10 },
  large:  { circle: 44, icon: 24, border: 2.5, pointer: 10, glow: 12 },
} as const;

/**
 * Full marker with vector icon — used for the SELECTED marker only.
 * Colored circle + white MaterialCommunityIcons glyph + pointer triangle.
 */
const UtilityMarkerComponent: React.FC<UtilityMarkerProps> = ({
  utility,
  size = 'large',
  isSelected = false,
}) => {
  const s = SIZES[size];
  const totalWidth = s.circle + (isSelected ? s.glow * 2 : 4);
  const totalHeight = s.circle + s.pointer + 2 + (isSelected ? s.glow : 0);

  const utilityType = utility.type || utility.category || 'water_fountain';
  const categoryColor = getUtilityColor(utilityType).primary;
  const iconName = getUtilityVectorIcon(utilityType);

  return (
    <View style={[styles.wrapper, { width: totalWidth, height: totalHeight }]}>
      {isSelected && (
        <View style={[
          styles.selectedGlow,
          {
            width: s.circle + s.glow * 2,
            height: s.circle + s.glow * 2,
            borderRadius: (s.circle + s.glow * 2) / 2,
            backgroundColor: categoryColor,
          },
        ]} />
      )}

      <View style={[
        styles.circle,
        {
          width: s.circle,
          height: s.circle,
          borderRadius: s.circle / 2,
          borderWidth: s.border,
          backgroundColor: categoryColor,
        },
        isSelected && styles.selectedCircle,
      ]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={s.icon}
          color="#FFFFFF"
        />
      </View>

      <View style={[
        styles.pointer,
        {
          borderLeftWidth: s.pointer,
          borderRightWidth: s.pointer,
          borderTopWidth: s.pointer + 2,
          borderTopColor: categoryColor,
        },
      ]} />
    </View>
  );
};

export const UtilityMarker = memo(UtilityMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.utility.id === nextProps.utility.id &&
    prevProps.utility.type === nextProps.utility.type &&
    prevProps.utility.category === nextProps.utility.category &&
    prevProps.size === nextProps.size &&
    prevProps.isSelected === nextProps.isSelected
  );
});

const styles = StyleSheet.create({
  // Bulk dot: 16px colored circle with 2px white border
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Full marker styles
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedGlow: {
    position: 'absolute',
    top: 0,
    opacity: 0.3,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});

export default UtilityMarker;
