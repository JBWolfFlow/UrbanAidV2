import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useThemeStore } from '../stores/themeStore';
import { colors } from '../theme/colors';
import { tokens } from '../theme/tokens';

interface TermsOfServiceScreenProps {
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

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
          Please read these Terms of Service ("Terms") carefully before using the UrbanAid mobile application ("App"). By downloading, installing, or using the App, you agree to be bound by these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          1. Acceptance of Terms
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          By accessing or using UrbanAid, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the App.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          2. Description of Service
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          UrbanAid is a community-driven mobile application that helps users locate public utilities such as water fountains, public restrooms, EV charging stations, WiFi hotspots, and other amenities. Users can:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} View utility locations on an interactive map
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Add new utility locations
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Verify existing utility information
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Search for specific types of utilities
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          3. User Accounts
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          Some features of the App may require you to create an account. When creating an account, you agree to:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Provide accurate and complete information
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Maintain the security of your account credentials
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Promptly update any changes to your information
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Accept responsibility for all activities under your account
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          4. User-Generated Content
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          UrbanAid allows users to contribute content including utility locations, descriptions, and verifications ("User Content"). By submitting User Content, you:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Grant UrbanAid a non-exclusive, royalty-free, worldwide license to use, display, and distribute your User Content
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Represent that your User Content is accurate to the best of your knowledge
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Agree not to submit false, misleading, or harmful content
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Acknowledge that we may remove User Content that violates these Terms
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          5. Prohibited Conduct
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          When using UrbanAid, you agree not to:
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Submit false or misleading utility information
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Use the App for any illegal purpose
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Attempt to gain unauthorized access to the App or its systems
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Interfere with other users' use of the App
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Upload malicious code or attempt to compromise security
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Use automated systems to access the App without permission
        </Text>
        <Text style={[styles.bulletPoint, { color: textColor }]}>
          {'\u2022'} Harass, abuse, or threaten other users
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          6. Accuracy of Information
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          UrbanAid relies on community contributions for utility information. While we strive for accuracy, we cannot guarantee that all information is current, complete, or accurate. Utility availability, hours, and conditions may change without notice. Always verify critical information independently.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          7. Intellectual Property
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          The App and its original content (excluding User Content), features, and functionality are owned by UrbanAid and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          8. Disclaimer of Warranties
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          9. Limitation of Liability
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, URBANAID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP. THIS INCLUDES DAMAGES ARISING FROM RELIANCE ON ANY UTILITY INFORMATION PROVIDED THROUGH THE APP.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          10. Indemnification
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          You agree to indemnify and hold harmless UrbanAid and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the App or violation of these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          11. Termination
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We may terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the App will cease immediately.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          12. Changes to Terms
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms in the App. Your continued use of the App after such changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          13. Governing Law
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which UrbanAid operates, without regard to its conflict of law provisions.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          14. Contact Information
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={[styles.contactInfo, { color: colors.gradient.start }]}>
          legal@urbanaid.app
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

export default TermsOfServiceScreen;
