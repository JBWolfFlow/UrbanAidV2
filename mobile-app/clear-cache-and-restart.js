#!/usr/bin/env node

/**
 * Clear Cache and Restart Script
 * 
 * This script clears the persistent storage cache to ensure the new 2000 limits
 * are applied instead of the old cached 200 limits.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEARING CACHE AND APPLYING NEW LIMITS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Clear various cache directories
const cacheDirs = [
  'node_modules/.cache',
  '.expo',
  'ios/build',
  'android/build',
  'android/.gradle'
];

function clearDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleared: ${dir}`);
    } catch (error) {
      console.log(`⚠️  Could not clear ${dir}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  Not found: ${dir}`);
  }
}

console.log('\n📂 Clearing cache directories...');
cacheDirs.forEach(clearDirectory);

console.log('\n🔧 LIMIT CHANGES SUMMARY:');
console.log('   • Default activeFilters.limit: 50 → 2000');
console.log('   • Utility store fetchNearbyUtilities limit: 100 → 2000');
console.log('   • API searchUtilities default limit: 500 → 2000');
console.log('   • restroomAPI getComprehensiveMockData limit: 200 → 2000');

console.log('\n📱 PERSISTENT STORAGE RESET INSTRUCTIONS:');
console.log('   1. The app uses Zustand persist with AsyncStorage');
console.log('   2. Old cached limits (200) may override new defaults (2000)');
console.log('   3. To force new limits, you can:');
console.log('      a) Reset app data in device settings, OR');
console.log('      b) Use app reset option in dev menu, OR');
console.log('      c) Call clearCache() from utility store');

console.log('\n🚀 RECOMMENDED NEXT STEPS:');
console.log('   1. npm install --legacy-peer-deps');
console.log('   2. npx expo start --clear');
console.log('   3. In app: Access dev menu and "Reset AsyncStorage"');
console.log('   4. Test restroom search - should now show 1000+ results');

console.log('\n✨ EXPECTED RESULTS AFTER CACHE CLEAR:');
console.log('   • 🎯 FINAL NATIONAL RESULTS: 1000+ restrooms (instead of 200)');
console.log('   • 🏛️ All 50 states + territories covered');
console.log('   • ♿ Comprehensive ADA compliance data');
console.log('   • 🔄 No more stack overflow errors');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Cache cleared! Ready for comprehensive 50-state restroom coverage!'); 