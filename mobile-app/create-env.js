#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Environment variables content
const envContent = `# UrbanAid Environment Variables

# API Configuration
API_URL=http://localhost:8000

# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyDOahtj8yxnSU71jXhaYCaPvfCpUFJRGpg

# App Configuration
APP_NAME=UrbanAid
APP_VERSION=1.0.0

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_CRASH_REPORTING=false
ENABLE_DEBUG_LOGS=true

# API Timeouts (milliseconds)
API_TIMEOUT=10000
LOCATION_TIMEOUT=15000

# Map Configuration
MAP_INITIAL_ZOOM=15
DEFAULT_SEARCH_RADIUS=5.0
MAX_SEARCH_RADIUS=50.0
`;

// Write .env file
const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('🔑 Google Maps API Key configured');
  console.log('🚀 You can now run: npm install && npx react-native run-ios');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please create the .env file manually with the content above');
}

// Also create a backup in case someone needs it
const envExamplePath = path.join(__dirname, '.env.example');
try {
  fs.writeFileSync(envExamplePath, envContent);
  console.log('📄 .env.example also created as a backup');
} catch (error) {
  console.log('⚠️  Could not create .env.example, but .env is ready');
} 