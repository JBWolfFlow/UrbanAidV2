import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useThemeStore } from '../stores/themeStore';
import { colors } from '../theme/colors';
import { tokens } from '../theme/tokens';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

const ChevronLeftIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const backgroundColor = isDarkMode ? colors.dark.background : colors.light.background;
  const textColor = isDarkMode ? colors.dark.text.primary : colors.light.text.primary;
  const secondaryTextColor = isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + tokens.spacing.md }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + tokens.spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: secondaryTextColor }]}>
          Last Updated: February 2026
        </Text>

        <Text style={[styles.paragraph, { color: textColor }]}>
          Welcome to UrbanAid. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          1. Information We Collect
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We may collect information about you in a variety of ways. The information we may collect via the Application includes:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Personal Data:</Text> Voluntarily provided information such as your name, email address, and profile picture when you register for an account.
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Location Data:</Text> With your permission, we collect precise location data to show nearby utilities and allow you to add new utility locations.
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Usage Data:</Text> Information about your interactions with the app, including utilities you view, add, or verify.
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Device Data:</Text> Device type, operating system version, and unique device identifiers.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          2. How We Use Your Information
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. We may use information collected about you to:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Create and manage your account
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Display utility locations near you
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Allow you to contribute new utility locations
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Enable verification of utility information
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Improve the accuracy of our utility database
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Send you app updates and notifications (with your consent)
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          3. Disclosure of Your Information
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>By Law or to Protect Rights:</Text> If we believe the release of information is necessary to respond to legal process or protect rights.
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Third-Party Service Providers:</Text> We may share your information with third parties that perform services for us, including data analysis and hosting services.
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} <Text style={styles.bold}>Community Contributions:</Text> Utility locations you add may be visible to other users, but your personal information is not attached to these contributions unless you choose to display your username.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          4. Security of Your Information
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure your information, no security measures are perfect, and we cannot guarantee absolute security.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          5. Location Services
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          UrbanAid requires access to your device's location services to function properly. Location data is used to:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Show utilities near your current location
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Allow accurate placement of new utility markers
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Provide distance calculations to nearby utilities
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          You can disable location services at any time through your device settings, but this will limit the app's functionality.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          6. Data Retention
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. We will retain and use your information to comply with our legal obligations, resolve disputes, and enforce our agreements.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          7. Your Rights
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} The right to access your personal data
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} The right to correct inaccurate data
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} The right to delete your data
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} The right to data portability
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} The right to withdraw consent
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          8. Children's Privacy
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          UrbanAid is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          9. Changes to This Privacy Policy
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          10. Contact Us
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          If you have questions or comments about this Privacy Policy, please contact us at:
        </Text>
        <Text style={[styles.contactInfo, { color: colors.gradient.start }]}>
          privacy@urbanaid.app
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: tokens.typography.headlineSmall.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
  },
  lastUpdated: {
    fontSize: tokens.typography.bodySmall.fontSize,
    marginBottom: tokens.spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: tokens.typography.titleMedium.fontSize,
    fontWeight: '600',
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.sm,
  },
  paragraph: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    lineHeight: 24,
    marginBottom: tokens.spacing.md,
  },
  bulletPoint: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    lineHeight: 24,
    marginBottom: tokens.spacing.sm,
    paddingLeft: tokens.spacing.md,
  },
  bold: {
    fontWeight: '600',
  },
  contactInfo: {
    fontSize: tokens.typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginTop: tokens.spacing.sm,
  },
});

export default PrivacyPolicyScreen;
