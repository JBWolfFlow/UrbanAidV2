const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo SDK 53
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Add TypeScript support to source extensions
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;
