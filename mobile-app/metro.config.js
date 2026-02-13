const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo SDK 53
 * https://docs.expo.dev/guides/customizing-metro/
 * 
 * Fixed path resolution issues based on:
 * https://github.com/storybookjs/react-native/issues/405
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Add TypeScript support to source extensions
config.resolver.sourceExts.push('ts', 'tsx');

// Fix for "Unable to resolve ../../App" issue
// Disable inline requires to prevent stack overflow errors
config.transformer.inlineRequires = false;

// Ensure proper project root resolution
config.projectRoot = __dirname;

// Add resolver configuration for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
