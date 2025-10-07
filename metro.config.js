const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific platform extensions
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Configure platform-specific file extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.tsx', 'web.ts', 'web.jsx', 'web.js'];

// Add JSON module support
config.resolver.assetExts = [...config.resolver.assetExts, 'json'];

// Configure web-specific resolver
config.resolver.resolverMainFields = ['browser', 'main'];

// Platform-specific extensions priority
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config; 