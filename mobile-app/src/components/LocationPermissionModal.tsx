import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  Paragraph,
  Button,
  useTheme,
} from 'react-native-paper';
import { useLocationStore } from '../stores/locationStore';
import { requestLocationPermission } from '../utils/permissions';

export const LocationPermissionModal: React.FC = () => {
  const theme = useTheme();
  const { hasLocationPermission, setLocationPermission } = useLocationStore();

  const handleRequestPermission = async () => {
    const granted = await requestLocationPermission();
    setLocationPermission(granted);
  };

  const handleSkip = () => {
    // User can skip location permission for now
    setLocationPermission(false);
  };

  return (
    <Portal>
      <Modal
        visible={!hasLocationPermission}
        dismissable={false}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Card mode="outlined">
          <Card.Content style={styles.content}>
            <Title style={styles.title}>Location Access</Title>
            <Paragraph style={styles.description}>
              UrbanAid needs access to your location to show nearby utilities and provide accurate directions.
            </Paragraph>
            <Paragraph style={styles.note}>
              Your location data is only used to improve your experience and is never shared.
            </Paragraph>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button mode="outlined" onPress={handleSkip}>
              Skip
            </Button>
            <Button mode="contained" onPress={handleRequestPermission}>
              Allow Location
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
  },
  content: {
    paddingVertical: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
}); 