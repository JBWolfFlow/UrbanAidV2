import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  List,
  Switch,
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  Portal,
  Modal,
  RadioButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../stores/themeStore';
import { useLocationStore } from '../stores/locationStore';

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { hasLocationPermission } = useLocationStore();
  
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsLanguageModalVisible(false);
    // TODO: Implement language change logic
    Alert.alert('Language Changed', `Language set to ${languages.find(l => l.code === languageCode)?.name}`);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Export your added utilities and preferences?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export',
          onPress: () => {
            // TODO: Implement data export
            Alert.alert('Success', 'Data exported successfully');
          }
        },
      ]
    );
  };

  const getSelectedLanguageName = () => {
    return languages.find(l => l.code === selectedLanguage)?.name || 'English';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* App Settings */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>App Settings</Title>
            
            <List.Item
              title="Dark Mode"
              description="Toggle dark/light theme"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                />
              )}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Language"
              description={getSelectedLanguageName()}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setIsLanguageModalVisible(true)}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Notifications"
              description="Receive app notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Privacy</Title>
            
            <List.Item
              title="Location Sharing"
              description={hasLocationPermission ? "Location access granted" : "Location access denied"}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={locationSharing && hasLocationPermission}
                  onValueChange={setLocationSharing}
                  disabled={!hasLocationPermission}
                />
              )}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Data Export"
              description="Export your data"
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleDataExport}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>App Information</Title>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={() => Alert.alert('Privacy Policy', 'Opening privacy policy...')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={() => Alert.alert('Terms of Service', 'Opening terms of service...')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="About UrbanAid"
              description="Learn more about our mission"
              left={(props) => <List.Icon {...props} icon="heart" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(
                'About UrbanAid',
                'UrbanAid helps you find nearby public utilities to make urban living easier and more accessible for everyone.'
              )}
            />
          </Card.Content>
        </Card>

        {/* Storage */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Title style={styles.sectionTitle}>Storage</Title>
            
            <List.Item
              title="Clear Cache"
              description="Free up storage space"
              left={(props) => <List.Icon {...props} icon="broom" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleClearCache}
            />
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            Made with ❤️ for urban accessibility
          </Paragraph>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Portal>
        <Modal
          visible={isLanguageModalVisible}
          onDismiss={() => setIsLanguageModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Title style={styles.modalTitle}>Select Language</Title>
          
          <RadioButton.Group
            onValueChange={handleLanguageChange}
            value={selectedLanguage}
          >
            {languages.map((language) => (
              <View key={language.code} style={styles.radioItem}>
                <RadioButton.Item
                  label={`${language.name} (${language.nativeName})`}
                  value={language.code}
                  style={styles.radioButton}
                />
              </View>
            ))}
          </RadioButton.Group>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setIsLanguageModalVisible(false)}
            >
              Cancel
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
  },
  divider: {
    marginVertical: 4,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
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
  radioItem: {
    marginBottom: 4,
  },
  radioButton: {
    paddingVertical: 4,
  },
  modalActions: {
    marginTop: 16,
    alignItems: 'center',
  },
});

export default ProfileScreen; 