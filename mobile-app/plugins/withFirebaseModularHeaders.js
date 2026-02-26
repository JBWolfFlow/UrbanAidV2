/**
 * Expo Config Plugin: Podfile Customizations
 *
 * Adds three things the default Expo Podfile doesn't include:
 * 1. Targeted modular headers for Firebase's C dependencies
 *    (global use_modular_headers! breaks React Native's module maps)
 * 2. react-native-permissions setup — selective permission pod installation
 * 3. react-native-google-maps pod — required for Google Maps provider
 *
 * Runs during `expo prebuild` so the Podfile is always correct.
 */
const { withPodfile } = require('expo/config-plugins');

const FIREBASE_MODULAR_HEADERS = `
# Firebase Swift pods require modular headers for specific C dependencies
# (global use_modular_headers! breaks React Native's module maps)
pod 'GoogleUtilities', :modular_headers => true
pod 'GoogleDataTransport', :modular_headers => true
pod 'nanopb', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreInternal', :modular_headers => true
pod 'FirebaseCoreExtension', :modular_headers => true
pod 'FirebaseInstallations', :modular_headers => true
pod 'FirebaseSessions', :modular_headers => true
pod 'FirebaseCrashlytics', :modular_headers => true
pod 'FirebaseAnalytics', :modular_headers => true
pod 'GoogleAppMeasurement', :modular_headers => true`;

const PERMISSIONS_BLOCK = `
# react-native-permissions setup
def node_require(script)
  require Pod::Executable.execute_command('node', ['-p',
    "require.resolve('\#{script}', {paths: [process.argv[1]]})",
    __dir__]).strip
end

node_require('react-native-permissions/scripts/setup.rb')

setup_permissions([
  'LocationWhenInUse',
  'Camera',
  'PhotoLibrary',
])`;

const GOOGLE_MAPS_POD = `  pod 'react-native-google-maps', path: File.dirname(\`node --print "require.resolve('react-native-maps/package.json')"\`)`;

module.exports = function withPodfileCustomizations(config) {
  return withPodfile(config, (podfileConfig) => {
    let podfile = podfileConfig.modResults.contents;

    // 1. Add targeted modular headers for Firebase (NOT global use_modular_headers!)
    if (!podfile.includes('GoogleUtilities') || !podfile.includes(':modular_headers')) {
      podfile = podfile.replace(
        'prepare_react_native_project!',
        `prepare_react_native_project!\n${FIREBASE_MODULAR_HEADERS}`
      );
    }

    // 2. Add react-native-permissions setup
    if (!podfile.includes('react-native-permissions/scripts/setup.rb')) {
      podfile = podfile.replace(
        "target 'UrbanAid' do",
        `${PERMISSIONS_BLOCK}\n\ntarget 'UrbanAid' do`
      );
    }

    // 3. Add react-native-google-maps pod
    if (!podfile.includes('react-native-google-maps')) {
      podfile = podfile.replace(
        '  config = use_native_modules!(config_command)',
        `${GOOGLE_MAPS_POD}\n  config = use_native_modules!(config_command)`
      );
    }

    podfileConfig.modResults.contents = podfile;
    return podfileConfig;
  });
};
