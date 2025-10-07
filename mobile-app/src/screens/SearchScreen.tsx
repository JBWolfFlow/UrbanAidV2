import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  FAB,
  Portal,
  Modal,
  Button,
  Surface,
  Divider,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useUtilityStore } from '../stores/utilityStore';
import { useLocationStore } from '../stores/locationStore';
import { searchUtilities } from '../services/api';
import { Utility, UtilityType } from '../types/utility';
import { calculateDistance } from '../utils/location';
import { getUtilityTypeName } from '../utils/utilityHelpers';
import { useTranslation } from '../services/i18n';

const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { userLocation } = useLocationStore();
  const { utilities, setUtilities } = useUtilityStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<UtilityType[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Available utility types for filtering
  const utilityTypes: UtilityType[] = [
    'water_fountain',
    'restroom',
    'charging_station',
    'parking',
    'wifi',
    'atm',
    'phone_booth',
    'bench',
  ];

  // Search utilities query
  const {
    data: searchResults,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['searchUtilities', searchQuery, selectedFilters],
    queryFn: () => searchUtilities({
      query: searchQuery,
      types: selectedFilters,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radius: 5000, // 5km radius
    }),
    enabled: searchQuery.length > 0 || selectedFilters.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const toggleFilter = useCallback((type: UtilityType) => {
    setSelectedFilters(prev =>
      prev.includes(type)
        ? prev.filter(f => f !== type)
        : [...prev, type]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters([]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const getUtilityTypeLabel = (type: UtilityType): string => {
    // Use the utility helper function for consistency
    return getUtilityTypeName(type);
  };

  const renderUtilityItem = ({ item }: { item: Utility }) => {
    const distance = userLocation
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude
        )
      : null;

    return (
      <Card style={styles.utilityCard} mode="outlined">
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.utilityName}>{item.name}</Title>
            {distance && (
              <Chip mode="outlined" compact>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </Chip>
            )}
          </View>
          
          <Paragraph style={styles.utilityDescription}>
            {item.description || t('search.noDescription')}
          </Paragraph>
          
          <View style={styles.chipContainer}>
            <Chip
              mode="outlined"
              icon="map-marker"
              textStyle={styles.chipText}
            >
              {getUtilityTypeLabel(item.type || item.category as UtilityType)}
            </Chip>
            
            {item.isAccessible && (
              <Chip
                mode="outlined"
                icon="wheelchair-accessibility"
                textStyle={styles.chipText}
              >
                {t('search.accessible')}
              </Chip>
            )}
            
            {item.is24Hours && (
              <Chip
                mode="outlined"
                icon="clock"
                textStyle={styles.chipText}
              >
                {t('search.24hours')}
              </Chip>
            )}
          </View>
          
          {item.address && (
            <Paragraph style={styles.address}>
              📍 {item.address}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const filteredUtilities = searchResults?.data || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('search.placeholder')}
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          loading={isLoading}
        />
        
        <View style={styles.filtersRow}>
          <View style={styles.selectedFilters}>
            {selectedFilters.map((filter) => (
              <Chip
                key={filter}
                mode="flat"
                onClose={() => toggleFilter(filter)}
                style={styles.filterChip}
              >
                {getUtilityTypeLabel(filter)}
              </Chip>
            ))}
          </View>
          
          <Button
            mode="outlined"
            onPress={() => setIsFilterModalVisible(true)}
            icon="filter-variant"
            compact
          >
            {t('search.filters')}
          </Button>
        </View>
      </View>

      <FlatList
        data={filteredUtilities}
        renderItem={renderUtilityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilters.length > 0
                ? t('search.noResults')
                : t('search.startSearching')}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={isFilterModalVisible}
          onDismiss={() => setIsFilterModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Title style={styles.modalTitle}>{t('search.filterBy')}</Title>
          
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>{t('search.utilityTypes')}</Text>
            <View style={styles.filterGrid}>
              {utilityTypes.map((type) => (
                <Chip
                  key={type}
                  mode={selectedFilters.includes(type) ? 'flat' : 'outlined'}
                  selected={selectedFilters.includes(type)}
                  onPress={() => toggleFilter(type)}
                  style={styles.filterOption}
                >
                  {getUtilityTypeLabel(type)}
                </Chip>
              ))}
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.actionButton}
            >
              {t('search.clearFilters')}
            </Button>
            <Button
              mode="contained"
              onPress={() => setIsFilterModalVisible(false)}
              style={styles.actionButton}
            >
              {t('search.applyFilters')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedFilters: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  utilityCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  utilityName: {
    flex: 1,
    marginRight: 8,
    fontSize: 18,
  },
  utilityDescription: {
    marginBottom: 12,
    color: '#666',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
  },
  address: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default SearchScreen; 