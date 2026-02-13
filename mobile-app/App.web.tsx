import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';

// Import national restroom database
import { enhancedNationalRestrooms } from './src/data/nationalRestrooms';

const { width, height } = Dimensions.get('window');

// Web-compatible Map component (placeholder)
const WebMap = ({ utilities, onMarkerPress }: any) => (
  <View style={styles.mapPlaceholder}>
    <Text style={styles.mapText}>🗺️ Interactive Map</Text>
    <Text style={styles.mapSubtext}>
      {utilities.length} utilities loaded across all 50 states
    </Text>
    <ScrollView style={styles.utilitiesList}>
      {utilities.slice(0, 10).map((utility: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.utilityItem}
          onPress={() => onMarkerPress(utility)}
        >
          <Text style={styles.utilityName}>{utility.name}</Text>
          <Text style={styles.utilityAddress}>{utility.address}</Text>
          <Text style={styles.utilityType}>📍 {utility.type}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

export default function App() {
  const [utilities, setUtilities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load national database
    console.log('🇺🇸 Loading UrbanAid National Database...');
    setUtilities(enhancedNationalRestrooms || []);
    setIsLoading(false);
    
    console.log(`📊 Loaded ${enhancedNationalRestrooms.length} facilities`);
    console.log('🌟 50-state coverage active!');
  }, []);

  const filteredUtilities = utilities.filter((utility) => {
    const matchesSearch = utility.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         utility.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === 'All States' || 
                        utility.address?.includes(selectedState);
    return matchesSearch && matchesState;
  });

  const handleMarkerPress = (utility: any) => {
    alert(`${utility.name}\n${utility.address}\n⭐ Rating: ${utility.rating || 'N/A'}`);
  };

  const states = [
    'All States', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
    'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🇺🇸 Loading UrbanAid...</Text>
          <Text style={styles.loadingSubtext}>50-State Database</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🇺🇸 UrbanAid</Text>
        <Text style={styles.subtitle}>
          {filteredUtilities.length} facilities • All 50 States
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restrooms..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal style={styles.stateSelector}>
        {states.map((state) => (
          <TouchableOpacity
            key={state}
            style={[
              styles.stateButton,
              selectedState === state && styles.selectedStateButton
            ]}
            onPress={() => setSelectedState(state)}
          >
            <Text style={[
              styles.stateButtonText,
              selectedState === state && styles.selectedStateButtonText
            ]}>
              {state}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <WebMap 
        utilities={filteredUtilities}
        onMarkerPress={handleMarkerPress}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{utilities.length}</Text>
          <Text style={styles.statLabel}>Total Facilities</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>States Covered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUtilities.length}</Text>
          <Text style={styles.statLabel}>Filtered Results</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stateSelector: {
    paddingHorizontal: 15,
  },
  stateButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedStateButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  stateButtonText: {
    color: '#333',
    fontSize: 14,
  },
  selectedStateButtonText: {
    color: 'white',
  },
  mapPlaceholder: {
    flex: 1,
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  mapText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  mapSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  utilitiesList: {
    flex: 1,
  },
  utilityItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  utilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  utilityAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  utilityType: {
    fontSize: 14,
    color: '#2196F3',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 