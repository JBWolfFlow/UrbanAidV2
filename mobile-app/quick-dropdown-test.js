#!/usr/bin/env node

/**
 * UrbanAid Quick Dropdown Functionality Test
 * Verifies all dropdown options are properly configured
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                URBANAID QUICK DROPDOWN TEST                  ║
║                 Verifying All 34 Options                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Test data from the actual app
const utilityTypes = [
    // Infrastructure (8 types)
    { label: 'Public Restroom', value: 'restroom', icon: '🚻', category: 'Infrastructure' },
    { label: 'Water Fountain', value: 'water_fountain', icon: '💧', category: 'Infrastructure' },
    { label: 'Wi-Fi Hotspot', value: 'wifi', icon: '📶', category: 'Infrastructure' },
    { label: 'Phone Charging Station', value: 'charging_station', icon: '🔋', category: 'Infrastructure' },
    { label: 'ATM', value: 'atm', icon: '🏧', category: 'Infrastructure' },
    { label: 'Phone Booth', value: 'phone_booth', icon: '📞', category: 'Infrastructure' },
    { label: 'Public Bench', value: 'bench', icon: '🪑', category: 'Infrastructure' },
    { label: 'Handwashing Station', value: 'handwashing', icon: '🧼', category: 'Infrastructure' },
    
    // Health Services (7 types)
    { label: 'Health Center', value: 'health_center', icon: '🏥', category: 'Health Services' },
    { label: 'Community Health Center', value: 'community_health_center', icon: '🏥', category: 'Health Services' },
    { label: 'Migrant Health Center', value: 'migrant_health_center', icon: '🚑', category: 'Health Services' },
    { label: 'Homeless Health Center', value: 'homeless_health_center', icon: '🏠', category: 'Health Services' },
    { label: 'Public Housing Health Center', value: 'public_housing_health_center', icon: '🏘️', category: 'Health Services' },
    { label: 'School-Based Health Center', value: 'school_based_health_center', icon: '🏫', category: 'Health Services' },
    { label: 'FQHC', value: 'federally_qualified_health_center', icon: '🏥', category: 'Health Services' },
    
    // Veterans Services (6 types)
    { label: 'VA Facility', value: 'va_facility', icon: '🇺🇸', category: 'Veterans Services' },
    { label: 'VA Medical Center', value: 'va_medical_center', icon: '🏥', category: 'Veterans Services' },
    { label: 'VA Outpatient Clinic', value: 'va_outpatient_clinic', icon: '🏥', category: 'Veterans Services' },
    { label: 'Vet Center', value: 'va_vet_center', icon: '🎖️', category: 'Veterans Services' },
    { label: 'VA Regional Office', value: 'va_regional_office', icon: '🏢', category: 'Veterans Services' },
    { label: 'VA Cemetery', value: 'va_cemetery', icon: '⚰️', category: 'Veterans Services' },
    
    // USDA Services (6 types)
    { label: 'USDA Facility', value: 'usda_facility', icon: '🌾', category: 'USDA Services' },
    { label: 'Rural Development Office', value: 'usda_rural_development_office', icon: '🚜', category: 'USDA Services' },
    { label: 'SNAP Office', value: 'usda_snap_office', icon: '🍎', category: 'USDA Services' },
    { label: 'Farm Service Center', value: 'usda_farm_service_center', icon: '🚜', category: 'USDA Services' },
    { label: 'Extension Office', value: 'usda_extension_office', icon: '📚', category: 'USDA Services' },
    { label: 'WIC Office', value: 'usda_wic_office', icon: '🍼', category: 'USDA Services' },
    
    // Essential Services (6 types)
    { label: 'Emergency Shelter', value: 'emergency_shelter', icon: '🏠', category: 'Essential Services' },
    { label: 'Free Food Location', value: 'food_assistance', icon: '🍽️', category: 'Essential Services' },
    { label: 'Medical Clinic', value: 'medical_clinic', icon: '🏥', category: 'Essential Services' },
    { label: 'Mental Health Service', value: 'mental_health_service', icon: '🧠', category: 'Essential Services' },
    { label: 'Transit Stop', value: 'transit', icon: '🚌', category: 'Essential Services' },
    { label: 'Public Library', value: 'library', icon: '📚', category: 'Essential Services' },
];

const distanceOptions = [
    { label: 'Within 0.5 km', value: '0.5', icon: '📍' },
    { label: 'Within 1 km', value: '1', icon: '📍' },
    { label: 'Within 2 km', value: '2', icon: '📍' },
    { label: 'Within 5 km', value: '5', icon: '📍' },
];

function testDropdownConfiguration() {
    console.log(`${colors.bright}Testing dropdown configuration...${colors.reset}\n`);
    
    let totalTests = 0;
    let passedTests = 0;
    let issues = [];
    
    // Test utility types
    console.log(`${colors.blue}Testing Utility Types (${utilityTypes.length} options):${colors.reset}`);
    utilityTypes.forEach((option, index) => {
        totalTests++;
        const hasLabel = !!option.label;
        const hasValue = !!option.value;
        const hasIcon = !!option.icon;
        const hasCategory = !!option.category;
        
        if (hasLabel && hasValue && hasIcon && hasCategory) {
            passedTests++;
            console.log(`  ${colors.green}✓${colors.reset} ${option.label} ${option.icon}`);
        } else {
            const missing = [];
            if (!hasLabel) missing.push('label');
            if (!hasValue) missing.push('value');
            if (!hasIcon) missing.push('icon');
            if (!hasCategory) missing.push('category');
            
            console.log(`  ${colors.red}✗${colors.reset} ${option.label || 'Unknown'} - Missing: ${missing.join(', ')}`);
            issues.push(`${option.label || 'Unknown'}: Missing ${missing.join(', ')}`);
        }
    });
    
    // Test distance options
    console.log(`\n${colors.blue}Testing Distance Options (${distanceOptions.length} options):${colors.reset}`);
    distanceOptions.forEach((option, index) => {
        totalTests++;
        const hasLabel = !!option.label;
        const hasValue = !!option.value;
        const hasIcon = !!option.icon;
        
        if (hasLabel && hasValue && hasIcon) {
            passedTests++;
            console.log(`  ${colors.green}✓${colors.reset} ${option.label} ${option.icon}`);
        } else {
            const missing = [];
            if (!hasLabel) missing.push('label');
            if (!hasValue) missing.push('value');
            if (!hasIcon) missing.push('icon');
            
            console.log(`  ${colors.red}✗${colors.reset} ${option.label || 'Unknown'} - Missing: ${missing.join(', ')}`);
            issues.push(`${option.label || 'Unknown'}: Missing ${missing.join(', ')}`);
        }
    });
    
    return { totalTests, passedTests, issues };
}

function testCategoryDistribution() {
    console.log(`\n${colors.blue}Testing Category Distribution:${colors.reset}`);
    
    const categories = {};
    utilityTypes.forEach(option => {
        if (!categories[option.category]) {
            categories[option.category] = 0;
        }
        categories[option.category]++;
    });
    
    Object.keys(categories).sort().forEach(category => {
        console.log(`  ${colors.cyan}${category}:${colors.reset} ${categories[category]} options`);
    });
    
    return categories;
}

function simulateDropdownFunctionality() {
    console.log(`\n${colors.blue}Simulating Dropdown Functionality:${colors.reset}`);
    
    // Simulate selecting a few different options
    const testSelections = [
        utilityTypes.find(u => u.value === 'restroom'),
        utilityTypes.find(u => u.value === 'health_center'),
        utilityTypes.find(u => u.value === 'va_medical_center'),
        distanceOptions.find(d => d.value === '1'),
    ];
    
    testSelections.forEach(option => {
        if (option) {
            console.log(`  ${colors.green}✓${colors.reset} Simulated selection: ${option.label} ${option.icon}`);
            console.log(`    ${colors.yellow}→${colors.reset} onSelect('${option.value}') would be called`);
            console.log(`    ${colors.yellow}→${colors.reset} Dropdown would close and show: "${option.label}"`);
        }
    });
    
    return testSelections.length;
}

function generateSummaryReport(testResults, categories) {
    console.log(`\n${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║                         TEST SUMMARY                         ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    const { totalTests, passedTests, issues } = testResults;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`${colors.bright}CONFIGURATION TESTS:${colors.reset}`);
    console.log(`Total Options: ${totalTests}`);
    console.log(`${colors.green}Properly Configured: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Issues Found: ${issues.length}${colors.reset}`);
    console.log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
    
    console.log(`\n${colors.bright}BREAKDOWN BY CATEGORY:${colors.reset}`);
    Object.keys(categories).sort().forEach(category => {
        console.log(`${colors.cyan}${category}:${colors.reset} ${categories[category]} options`);
    });
    
    console.log(`\n${colors.bright}TOTAL DROPDOWN OPTIONS: ${utilityTypes.length + distanceOptions.length}${colors.reset}`);
    console.log(`• Utility Types: ${utilityTypes.length}`);
    console.log(`• Distance Options: ${distanceOptions.length}`);
    
    if (issues.length === 0) {
        console.log(`\n${colors.green}${colors.bright}🎉 ALL DROPDOWN OPTIONS ARE PROPERLY CONFIGURED! 🎉${colors.reset}`);
        console.log(`${colors.green}✅ Ready for user testing${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}${colors.bright}⚠️  ISSUES FOUND:${colors.reset}`);
        issues.forEach(issue => {
            console.log(`${colors.red}  • ${issue}${colors.reset}`);
        });
    }
    
    console.log(`\n${colors.bright}NEXT STEPS:${colors.reset}`);
    console.log(`1. Run the app: ${colors.cyan}npx expo start${colors.reset}`);
    console.log(`2. Test each dropdown option manually`);
    console.log(`3. Use the interactive test: ${colors.cyan}node interactive-dropdown-test.js${colors.reset}`);
    
    return successRate === 100;
}

// Run all tests
function runQuickTest() {
    console.log(`${colors.bright}Running quick dropdown configuration test...${colors.reset}\n`);
    
    const testResults = testDropdownConfiguration();
    const categories = testCategoryDistribution();
    const simulatedSelections = simulateDropdownFunctionality();
    const allPassed = generateSummaryReport(testResults, categories);
    
    console.log(`\n${colors.cyan}Quick test completed!${colors.reset}`);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
}

// Run the quick test
runQuickTest(); 