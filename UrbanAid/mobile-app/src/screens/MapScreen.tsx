import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import {
  FAB,
  Searchbar,
  Portal,
  Modal,
  Card,
  Button,
  IconButton,
  Text,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/themeStore';
import { useLocationStore } from '../stores/locationStore';
import { useUtilityStore } from '../stores/utilityStore';
import { UtilityMarker } from '../components/UtilityMarker';
import { FilterModal } from '../components/FilterModal';
import { UtilityDetails } from '../components/UtilityDetails';
import { Utility } from '../types/utility';
import { getUtilityIcon } from '../utils/utilityHelpers';

const { width, height } = Dimensions.get('window');

/**
 * Main map screen component
 * Shows Google Maps with utility markers and search functionality
 */
const MapScreen: React.FC = () => {
  const { t } = useTranslation();
  const { currentTheme } = useThemeStore();
  const { currentLocation, getCurrentLocation, hasLocationPermission } = useLocationStore();
  const { utilities, fetchNearbyUtilities, isLoading } = useUtilityStore();
  
  const mapRef = useRef<MapView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    initializeMap();
  }, [hasLocationPermission]);

  useEffect(() => {
    if (currentLocation && mapReady) {
      fetchNearbyUtilities(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, mapReady]);

  /**
   * Initialize map with user location
   */
  const initializeMap = async () => {
    if (!hasLocationPermission) {
      return;
    }

    try {
      const location = await getCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  /**
   * Handle search query submission
   */
  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentLocation) return;

    try {
      // Implement search functionality
      // This would typically involve geocoding the search query
      // and filtering utilities based on the search term
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert(t('error'), 'Failed to search utilities');
    }
  };

  /**
   * Handle utility marker press
   */
  const handleMarkerPress = (utility: Utility) => {
    setSelectedUtility(utility);
    
    // Animate to marker location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: utility.latitude,
        longitude: utility.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  };

  /**
   * Handle my location button press
   */
  const handleMyLocationPress = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        t('location_permission_required'),
        t('location_permission_message')
      );
      return;
    }

    try {
      const location = await getCurrentLocation();
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('error'), 'Failed to get current location');
    }
  };

  /**
   * Handle map region change
   */
  const handleRegionChange = (region: any) => {
    // Fetch utilities for new region if significantly different
    if (region && currentLocation) {
      const distance = getDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        region.latitude,
        region.longitude
      );
      
      // If user moved more than 1km, fetch new utilities
      if (distance > 1) {
        fetchNearbyUtilities(region.latitude, region.longitude);
      }
    }
  };

  /**
   * Calculate distance between two coordinates
   */
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!hasLocationPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={currentTheme.colors.primary} />
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: currentTheme.colors.onBackground }]}>
            {t('location_permission_message')}
          </Text>
          <Button
            mode="contained"
            onPress={initializeMap}
            style={styles.permissionButton}
          >
            Enable Location
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme.colors.primary} />
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: currentTheme.colors.surface }]}>
        <Searchbar
          placeholder={t('find_nearby')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
          inputStyle={{ color: currentTheme.colors.onSurface }}
        />
        <IconButton
          icon="filter"
          size={24}
          onPress={() => setShowFilters(true)}
          iconColor={currentTheme.colors.primary}
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={handleRegionChange}
        mapType="standard"
      >
        {utilities.map((utility) => (
          <Marker
            key={utility.id}
            coordinate={{
              latitude: utility.latitude,
              longitude: utility.longitude,
            }}
            onPress={() => handleMarkerPress(utility)}
          >
            <UtilityMarker utility={utility} />
          </Marker>
        ))}
      </MapView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="crosshairs-gps"
          size="small"
          onPress={handleMyLocationPress}
          style={[styles.locationFab, { backgroundColor: currentTheme.colors.primaryContainer }]}
        />
      </View>

      {/* Filter Modal */}
      <Portal>
        <FilterModal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
        />
      </Portal>

      {/* Utility Details Modal */}
      <Portal>
        <Modal
          visible={!!selectedUtility}
          onDismiss={() => setSelectedUtility(null)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: currentTheme.colors.surface }
          ]}
        >
          {selectedUtility && (
            <UtilityDetails
              utility={selectedUtility}
              onClose={() => setSelectedUtility(null)}
            />
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  locationFab: {
    marginBottom: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: height * 0.8,
  },
});

export default MapScreen; 