import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  Switch,
  List,
  Portal,
  Modal,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore } from '../stores/locationStore';
import { Utility, UtilityCategory, UtilityType } from '../types/utility';

const AddUtilityScreen: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { userLocation, hasLocationPermission } = useLocationStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    address: '',
    isAccessible: false,
    is24Hours: false,
    latitude: userLocation?.latitude || 0,
    longitude: userLocation?.longitude || 0,
  });
  
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: userLocation?.latitude || 37.78825,
    longitude: userLocation?.longitude || -122.4324,
  });

  const utilityTypes = [
    { value: 'water_fountain', label: 'Water Fountain', icon: 'water' },
    { value: 'restroom', label: 'Restroom', icon: 'toilet' },
    { value: 'charging_station', label: 'Charging Station', icon: 'battery-charging' },
    { value: 'parking', label: 'Parking', icon: 'car' },
    { value: 'wifi', label: 'WiFi Hotspot', icon: 'wifi' },
    { value: 'atm', label: 'ATM', icon: 'cash' },
    { value: 'phone_booth', label: 'Phone Booth', icon: 'phone' },
    { value: 'bench', label: 'Bench', icon: 'chair-school' },
  ];

  // Add utility mutation (mock implementation)
  const addUtilityMutation = useMutation({
    mutationFn: async (data: Partial<Utility>) => {
      // Mock API call - simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Adding utility:', data);
      return { id: Date.now().toString(), ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      Alert.alert('Success', 'Utility added successfully!');
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to add utility. Please try again.');
      console.error('Add utility error:', error);
    },
  });

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      type: '',
      address: '',
      isAccessible: false,
      is24Hours: false,
      latitude: userLocation?.latitude || 0,
      longitude: userLocation?.longitude || 0,
    });
  }, [userLocation]);

  const handleLocationSelect = useCallback((coordinate: any) => {
    setSelectedLocation(coordinate);
    updateFormData('latitude', coordinate.latitude);
    updateFormData('longitude', coordinate.longitude);
  }, [updateFormData]);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the utility');
      return;
    }
    
    if (!formData.type) {
      Alert.alert('Error', 'Please select a utility type');
      return;
    }

    const utilityData: Partial<Utility> = {
      ...formData,
      category: formData.type as UtilityCategory,
      type: formData.type as UtilityType,
      id: Date.now().toString(),
      verified: false,
      rating: 0,
      reviewCount: 0,
      lastUpdated: new Date().toISOString(),
      wheelchair_accessible: formData.isAccessible,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addUtilityMutation.mutate(utilityData);
  }, [formData, addUtilityMutation]);

  const getSelectedTypeLabel = () => {
    const type = utilityTypes.find(t => t.value === formData.type);
    return type ? type.label : 'Select Type';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Basic Information</Title>
            
            <TextInput
              label="Utility Name *"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Central Park Water Fountain"
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Optional description or notes"
            />
            
            <TouchableOpacity
              style={styles.typeSelector}
              onPress={() => setIsTypeModalVisible(true)}
            >
              <TextInput
                label="Utility Type *"
                value={getSelectedTypeLabel()}
                editable={false}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </TouchableOpacity>
            
            <TextInput
              label="Address"
              value={formData.address}
              onChangeText={(text) => updateFormData('address', text)}
              style={styles.input}
              mode="outlined"
              placeholder="Street address or landmark"
            />
          </Card.Content>
        </Card>

        <Card style={styles.formCard} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Features</Title>
            
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Wheelchair Accessible</Text>
                <Text style={styles.switchSubtext}>Is this utility accessible?</Text>
              </View>
              <Switch
                value={formData.isAccessible}
                onValueChange={(value) => updateFormData('isAccessible', value)}
              />
            </View>
            
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>24/7 Available</Text>
                <Text style={styles.switchSubtext}>Available around the clock?</Text>
              </View>
              <Switch
                value={formData.is24Hours}
                onValueChange={(value) => updateFormData('is24Hours', value)}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.formCard} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Location</Title>
            <Paragraph style={styles.locationNote}>
              Tap the map to set the exact location of this utility
            </Paragraph>
            
            <TouchableOpacity
              style={styles.mapPreview}
              onPress={() => setIsMapModalVisible(true)}
            >
              <View style={styles.mapPlaceholder}>
                <Text>📍 Tap to select location</Text>
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={resetForm}
            style={styles.button}
            disabled={addUtilityMutation.isPending}
          >
            Reset
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={addUtilityMutation.isPending}
            disabled={addUtilityMutation.isPending}
          >
            Add Utility
          </Button>
        </View>
      </ScrollView>

      {/* Type Selection Modal */}
      <Portal>
        <Modal
          visible={isTypeModalVisible}
          onDismiss={() => setIsTypeModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Title style={styles.modalTitle}>Select Utility Type</Title>
          {utilityTypes.map((type) => (
            <List.Item
              key={type.value}
              title={type.label}
              left={(props) => <List.Icon {...props} icon={type.icon} />}
              onPress={() => {
                updateFormData('type', type.value);
                setIsTypeModalVisible(false);
              }}
              style={styles.typeOption}
            />
          ))}
        </Modal>
      </Portal>

      {/* Map Selection Modal */}
      <Portal>
        <Modal
          visible={isMapModalVisible}
          onDismiss={() => setIsMapModalVisible(false)}
          contentContainerStyle={styles.mapModalContainer}
        >
          <View style={styles.mapModalHeader}>
            <Title>Select Location</Title>
            <Button onPress={() => setIsMapModalVisible(false)}>Done</Button>
          </View>
          
          <View style={styles.mapError}>
            <Text>Map integration coming soon!</Text>
            <Text>Location: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</Text>
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
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  input: {
    marginBottom: 16,
  },
  typeSelector: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationNote: {
    marginBottom: 12,
    color: '#666',
  },
  mapPreview: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
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
  typeOption: {
    paddingVertical: 8,
  },
  mapModalContainer: {
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    maxHeight: '90%',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
});

export default AddUtilityScreen; 