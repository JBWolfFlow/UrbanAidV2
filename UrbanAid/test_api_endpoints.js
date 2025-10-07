#!/usr/bin/env node

/**
 * Test script for UrbanAid Government Data API Endpoints
 * Tests HRSA Health Centers, VA Facilities, and USDA Services integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

// Test coordinates (Washington, DC area)
const TEST_COORDS = {
  latitude: 38.9072,
  longitude: -77.0369
};

async function testEndpoint(name, url, params = {}) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`📡 GET ${url}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}${url}`, { params });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Data count: ${response.data.count || 'N/A'}`);
    console.log(`🏷️  Source: ${response.data.source || 'N/A'}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log(`📋 Sample facility: ${response.data.data[0].name}`);
      console.log(`📍 Location: ${response.data.data[0].address?.city || 'N/A'}, ${response.data.data[0].address?.state || 'N/A'}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.error(`   Details: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 UrbanAid Government Data API Integration Test');
  console.log('================================================');
  
  // Test API health
  await testEndpoint('API Health Check', '/health');
  
  // Test HRSA Health Centers
  console.log('\n🏥 HRSA HEALTH CENTERS');
  console.log('========================');
  
  await testEndpoint(
    'Nearby HRSA Health Centers',
    '/health-centers',
    { 
      latitude: TEST_COORDS.latitude, 
      longitude: TEST_COORDS.longitude, 
      radius_km: 25 
    }
  );
  
  await testEndpoint(
    'HRSA Health Centers by State (CA)',
    '/health-centers/state/CA',
    { limit: 10 }
  );
  
  // Test VA Facilities
  console.log('\n🇺🇸 VA MEDICAL FACILITIES');
  console.log('==========================');
  
  await testEndpoint(
    'Nearby VA Medical Facilities',
    '/va-facilities',
    { 
      latitude: TEST_COORDS.latitude, 
      longitude: TEST_COORDS.longitude, 
      radius_miles: 50,
      facility_type: 'health'
    }
  );
  
  await testEndpoint(
    'VA Facilities by State (NY)',
    '/va-facilities/state/NY',
    { facility_type: 'health', limit: 10 }
  );
  
  // Test USDA Facilities
  console.log('\n🌾 USDA FACILITIES');
  console.log('==================');
  
  await testEndpoint(
    'Nearby USDA Facilities',
    '/usda-facilities',
    { 
      latitude: TEST_COORDS.latitude, 
      longitude: TEST_COORDS.longitude, 
      radius_km: 50,
      facility_types: 'rural_development,snap,fsa'
    }
  );
  
  await testEndpoint(
    'USDA Facilities by State (TX)',
    '/usda-facilities/state/TX',
    { facility_types: 'rural_development,snap', limit: 10 }
  );
  
  // Test different facility types
  console.log('\n🔬 SPECIALIZED SEARCHES');
  console.log('========================');
  
  await testEndpoint(
    'VA Vet Centers Only',
    '/va-facilities',
    { 
      latitude: TEST_COORDS.latitude, 
      longitude: TEST_COORDS.longitude, 
      radius_miles: 100,
      facility_type: 'vet_center'
    }
  );
  
  await testEndpoint(
    'SNAP/Food Assistance Only',
    '/usda-facilities',
    { 
      latitude: TEST_COORDS.latitude, 
      longitude: TEST_COORDS.longitude, 
      radius_km: 50,
      facility_types: 'snap'
    }
  );
  
  console.log('\n✨ Test completed! Check results above.');
  console.log('\n💡 Tips:');
  console.log('   - Update coordinates in script to test different locations');
  console.log('   - Try different facility types (health, benefits, cemetery, vet_center)');
  console.log('   - Adjust radius to find more or fewer results');
  console.log('   - Check your API server is running on http://localhost:8000');
}

// Handle async execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };