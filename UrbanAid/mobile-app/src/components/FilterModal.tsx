import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Switch,
  List,
  Divider,
  Text,
  useTheme,
} from 'react-native-paper';
import { UtilityType } from '../types/utility';

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  onApplyFilters?: (filters: FilterState) => void;
}

interface FilterState {
  utilityTypes: UtilityType[];
  verifiedOnly: boolean;
  accessibleOnly: boolean;
  openNow: boolean;
  maxDistance: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onDismiss,
  onApplyFilters,
}) => {
  const theme = useTheme();
  
  const [filters, setFilters] = useState<FilterState>({
    utilityTypes: [],
    verifiedOnly: false,
    accessibleOnly: false,
    openNow: false,
    maxDistance: 5000, // 5km default
  });

  const utilityTypes: { type: UtilityType; label: string; icon: string }[] = [
    { type: 'water_fountain', label: 'Water Fountains', icon: '💧' },
    { type: 'restroom', label: 'Restrooms', icon: '🚻' },
    { type: 'charging_station', label: 'Charging Stations', icon: '🔌' },
    { type: 'parking', label: 'Parking', icon: '🅿️' },
    { type: 'wifi', label: 'WiFi Hotspots', icon: '📶' },
    { type: 'atm', label: 'ATMs', icon: '🏧' },
    { type: 'phone_booth', label: 'Phone Booths', icon: '📞' },
    { type: 'bench', label: 'Benches', icon: '🪑' },
  ];

  const distanceOptions = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
  ];

  const toggleUtilityType = (type: UtilityType) => {
    setFilters(prev => ({
      ...prev,
      utilityTypes: prev.utilityTypes.includes(type)
        ? prev.utilityTypes.filter(t => t !== type)
        : [...prev.utilityTypes, type]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      utilityTypes: [],
      verifiedOnly: false,
      accessibleOnly: false,
      openNow: false,
      maxDistance: 5000,
    });
  };

  const applyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onDismiss();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.utilityTypes.length > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.accessibleOnly) count++;
    if (filters.openNow) count++;
    if (filters.maxDistance !== 5000) count++;
    return count;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Card mode="outlined">
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>Filter Utilities</Title>
              <Text style={[styles.activeFilters, { color: theme.colors.primary }]}>
                {getActiveFilterCount()} active
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Utility Types */}
              <View style={styles.section}>
                <Paragraph style={styles.sectionTitle}>Utility Types</Paragraph>
                <View style={styles.chipContainer}>
                  {utilityTypes.map((utilityType) => (
                    <Chip
                      key={utilityType.type}
                      mode={filters.utilityTypes.includes(utilityType.type) ? 'flat' : 'outlined'}
                      selected={filters.utilityTypes.includes(utilityType.type)}
                      onPress={() => toggleUtilityType(utilityType.type)}
                      style={styles.chip}
                      icon={() => <Text>{utilityType.icon}</Text>}
                    >
                      {utilityType.label}
                    </Chip>
                  ))}
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Quality Filters */}
              <View style={styles.section}>
                <Paragraph style={styles.sectionTitle}>Quality & Features</Paragraph>
                
                <List.Item
                  title="Verified Only"
                  description="Show only verified utilities"
                  left={() => <List.Icon icon="check-circle" />}
                  right={() => (
                    <Switch
                      value={filters.verifiedOnly}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, verifiedOnly: value }))
                      }
                    />
                  )}
                />

                <List.Item
                  title="Wheelchair Accessible"
                  description="Show only accessible utilities"
                  left={() => <List.Icon icon="wheelchair-accessibility" />}
                  right={() => (
                    <Switch
                      value={filters.accessibleOnly}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, accessibleOnly: value }))
                      }
                    />
                  )}
                />

                <List.Item
                  title="Open Now"
                  description="Show only currently open utilities"
                  left={() => <List.Icon icon="clock" />}
                  right={() => (
                    <Switch
                      value={filters.openNow}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, openNow: value }))
                      }
                    />
                  )}
                />
              </View>

              <Divider style={styles.divider} />

              {/* Distance Filter */}
              <View style={styles.section}>
                <Paragraph style={styles.sectionTitle}>Maximum Distance</Paragraph>
                <View style={styles.chipContainer}>
                  {distanceOptions.map((option) => (
                    <Chip
                      key={option.value}
                      mode={filters.maxDistance === option.value ? 'flat' : 'outlined'}
                      selected={filters.maxDistance === option.value}
                      onPress={() => 
                        setFilters(prev => ({ ...prev, maxDistance: option.value }))
                      }
                      style={styles.chip}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={clearAllFilters}
              style={styles.button}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={applyFilters}
              style={styles.button}
            >
              Apply Filters ({getActiveFilterCount()})
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  activeFilters: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 