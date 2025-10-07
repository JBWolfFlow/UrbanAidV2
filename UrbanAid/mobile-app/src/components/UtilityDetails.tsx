import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Text,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { Utility } from '../types/utility';

interface UtilityDetailsProps {
  utility: Utility;
  onClose: () => void;
}

export const UtilityDetails: React.FC<UtilityDetailsProps> = ({
  utility,
  onClose,
}) => {
  const theme = useTheme();

  const getUtilityIcon = (type: string): string => {
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

  const getUtilityTypeName = (type: string): string => {
    switch (type) {
      case 'water_fountain':
        return 'Water Fountain';
      case 'restroom':
        return 'Restroom';
      case 'charging_station':
        return 'Charging Station';
      case 'parking':
        return 'Parking';
      case 'wifi':
        return 'WiFi Hotspot';
      case 'atm':
        return 'ATM';
      case 'phone_booth':
        return 'Phone Booth';
      case 'bench':
        return 'Bench';
      default:
        return 'Utility';
    }
  };

  const handleGetDirections = () => {
    const url = `https://maps.google.com/?q=${utility.latitude},${utility.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const handleReport = () => {
    Alert.alert('Report Issue', 'Report functionality coming soon!');
  };

  const handleCall = () => {
    if (utility.phone) {
      Linking.openURL(`tel:${utility.phone}`);
    }
  };

  const handleWebsite = () => {
    if (utility.website) {
      Linking.openURL(utility.website);
    }
  };

  const renderRating = () => {
    const stars = [];
    const rating = utility.rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.stars}>{stars}</View>
        <Text style={styles.ratingText}>
          {rating.toFixed(1)} ({utility.rating_count || 0} reviews)
        </Text>
      </View>
    );
  };

  return (
    <Card mode="outlined">
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.icon}>{getUtilityIcon(utility.type || utility.category)}</Text>
            <View style={styles.titleInfo}>
              <Title style={styles.title}>{utility.name}</Title>
              <Text style={[styles.category, { color: theme.colors.primary }]}>
                {getUtilityTypeName(utility.type || utility.category)}
              </Text>
            </View>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
          />
        </View>

        {/* Status Chips */}
        <View style={styles.chipContainer}>
          {utility.verified && (
            <Chip mode="flat" icon="check-circle" style={styles.chip}>
              Verified
            </Chip>
          )}
          {(utility.wheelchair_accessible || utility.isAccessible) && (
            <Chip mode="outlined" icon="wheelchair-accessibility" style={styles.chip}>
              Accessible
            </Chip>
          )}
          {utility.is24Hours && (
            <Chip mode="outlined" icon="clock" style={styles.chip}>
              24/7
            </Chip>
          )}
        </View>

        {/* Rating */}
        {utility.rating && utility.rating > 0 && (
          <>
            <Divider style={styles.divider} />
            {renderRating()}
          </>
        )}

        {/* Description */}
        {utility.description && (
          <>
            <Divider style={styles.divider} />
            <Paragraph style={styles.description}>
              {utility.description}
            </Paragraph>
          </>
        )}

        {/* Contact Information */}
        {(utility.address || utility.phone || utility.website) && (
          <>
            <Divider style={styles.divider} />
            <Title style={styles.sectionTitle}>Information</Title>
            
            {utility.address && (
              <List.Item
                title="Address"
                description={utility.address}
                left={() => <List.Icon icon="map-marker" />}
              />
            )}
            
            {utility.phone && (
              <List.Item
                title="Phone"
                description={utility.phone}
                left={() => <List.Icon icon="phone" />}
                onPress={handleCall}
              />
            )}
            
            {utility.website && (
              <List.Item
                title="Website"
                description={utility.website}
                left={() => <List.Icon icon="web" />}
                onPress={handleWebsite}
              />
            )}

            {utility.hours && (
              <List.Item
                title="Hours"
                description={utility.hours}
                left={() => <List.Icon icon="clock" />}
              />
            )}
          </>
        )}
      </Card.Content>

      {/* Action Buttons */}
      <Card.Actions style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleShare}
          icon="share"
          style={styles.actionButton}
        >
          Share
        </Button>
        <Button
          mode="contained"
          onPress={handleGetDirections}
          icon="directions"
          style={styles.actionButton}
        >
          Directions
        </Button>
      </Card.Actions>

      {/* Secondary Actions */}
      <Card.Actions style={styles.secondaryActions}>
        <Button
          mode="text"
          onPress={handleReport}
          icon="flag"
          textColor={theme.colors.error}
        >
          Report Issue
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryActions: {
    justifyContent: 'center',
    paddingBottom: 8,
  },
}); 