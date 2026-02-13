// Simple test to check if all import paths can be resolved
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing import resolution for UrbanAid components...\n');

const filesToCheck = [
  'src/components/UtilityMarker.tsx',
  'src/components/FilterModal.tsx', 
  'src/components/UtilityDetails.tsx',
  'src/components/TabIcon.tsx',
  'src/components/LocationPermissionModal.tsx',
  'src/utils/utilityHelpers.ts',
  'src/utils/location.ts',
  'src/utils/permissions.ts',
  'src/screens/MapScreen.tsx',
  'src/screens/SearchScreen.tsx',
  'src/screens/AddUtilityScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/services/api.ts',
  'src/services/i18n.ts',
  'src/types/utility.ts',
  'src/stores/locationStore.ts',
  'src/theme/theme.ts'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 SUCCESS: All required files exist!');
  console.log('📱 The React Native bundler should now be able to resolve all imports.');
  console.log('\n💡 The "Unable to resolve module" errors should be fixed.');
} else {
  console.log('❌ FAILED: Some files are missing.');
  console.log('🔧 Create the missing files to fix import resolution errors.');
}

console.log('\n📋 Summary:');
console.log(`   Total files checked: ${filesToCheck.length}`);
console.log(`   Files found: ${filesToCheck.filter(file => fs.existsSync(path.join(__dirname, file))).length}`);
console.log(`   Files missing: ${filesToCheck.filter(file => !fs.existsSync(path.join(__dirname, file))).length}`); 