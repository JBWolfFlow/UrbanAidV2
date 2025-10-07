import React from 'react';
import { Icon } from 'react-native-paper';

interface TabIconProps {
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
}

export const TabIcon: React.FC<TabIconProps> = ({ routeName, focused, color, size }) => {
  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'Map':
        return focused ? 'map' : 'map-outline';
      case 'Search':
        return focused ? 'magnify' : 'magnify';
      case 'Add':
        return focused ? 'plus-circle' : 'plus-circle-outline';
      case 'Profile':
        return focused ? 'account' : 'account-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <Icon
      source={getIconName(routeName)}
      size={size}
      color={color}
    />
  );
}; 