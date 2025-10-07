/**
 * 🇺🇸 ALL 50 STATES DEMONSTRATION SERVICE
 * Comprehensive showcase of nationwide restroom coverage
 * 
 * Based on industry leaders:
 * - PHLUSH: Public restroom advocacy organization
 * - Where is Public Toilet: 280,000+ toilets worldwide
 * - The Bathroom App: Community-driven accuracy
 * - Flush App: 200,000 public toilets with offline access
 */

import { Utility } from '../types/utility';

// Complete US state coverage with realistic metropolitan distributions
const ALL_US_STATES_COMPLETE = {
  // WESTERN REGION
  'AK': { name: 'Alaska', pop: 733391, metros: ['Anchorage', 'Fairbanks', 'Juneau'], density: 0.4, restrooms: 5900 },
  'AZ': { name: 'Arizona', pop: 7151502, metros: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Glendale'], density: 24, restrooms: 57200 },
  'CA': { name: 'California', pop: 39538223, metros: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach'], density: 93, restrooms: 316000 },
  'CO': { name: 'Colorado', pop: 5773714, metros: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'], density: 21, restrooms: 46200 },
  'HI': { name: 'Hawaii', pop: 1455271, metros: ['Honolulu', 'Hilo', 'Kailua-Kona', 'Kaneohe'], density: 51, restrooms: 11600 },
  'ID': { name: 'Idaho', pop: 1839106, metros: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'], density: 8, restrooms: 14700 },
  'MT': { name: 'Montana', pop: 1084225, metros: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'], density: 3, restrooms: 8700 },
  'NV': { name: 'Nevada', pop: 3104614, metros: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'], density: 11, restrooms: 24800 },
  'NM': { name: 'New Mexico', pop: 2117522, metros: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'], density: 7, restrooms: 16900 },
  'OR': { name: 'Oregon', pop: 4237256, metros: ['Portland', 'Salem', 'Eugene', 'Gresham'], density: 17, restrooms: 33900 },
  'UT': { name: 'Utah', pop: 3271616, metros: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'], density: 15, restrooms: 26200 },
  'WA': { name: 'Washington', pop: 7705281, metros: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'], density: 42, restrooms: 61600 },
  'WY': { name: 'Wyoming', pop: 576851, metros: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'], density: 2, restrooms: 4600 },

  // SOUTHWESTERN REGION  
  'TX': { name: 'Texas', pop: 29145505, metros: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'], density: 42, restrooms: 233000 },
  'OK': { name: 'Oklahoma', pop: 3959353, metros: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'], density: 22, restrooms: 31700 },
  'AR': { name: 'Arkansas', pop: 3011524, metros: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'], density: 22, restrooms: 24100 },
  'LA': { name: 'Louisiana', pop: 4657757, metros: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'], density: 34, restrooms: 37300 },

  // MIDWESTERN REGION
  'IL': { name: 'Illinois', pop: 12812508, metros: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Peoria'], density: 85, restrooms: 102500 },
  'IN': { name: 'Indiana', pop: 6785528, metros: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'], density: 72, restrooms: 54300 },
  'IA': { name: 'Iowa', pop: 3190369, metros: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'], density: 22, restrooms: 25500 },
  'KS': { name: 'Kansas', pop: 2937880, metros: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'], density: 14, restrooms: 23500 },
  'MI': { name: 'Michigan', pop: 10037261, metros: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights'], density: 40, restrooms: 80300 },
  'MN': { name: 'Minnesota', pop: 5737915, metros: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'], density: 25, restrooms: 45900 },
  'MO': { name: 'Missouri', pop: 6196010, metros: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia'], density: 34, restrooms: 49600 },
  'NE': { name: 'Nebraska', pop: 1961504, metros: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'], density: 10, restrooms: 15700 },
  'ND': { name: 'North Dakota', pop: 779094, metros: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'], density: 4, restrooms: 6200 },
  'OH': { name: 'Ohio', pop: 11799448, metros: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'], density: 102, restrooms: 94400 },
  'SD': { name: 'South Dakota', pop: 886667, metros: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'], density: 4, restrooms: 7100 },
  'WI': { name: 'Wisconsin', pop: 5893718, metros: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'], density: 35, restrooms: 47100 },

  // SOUTHERN REGION
  'AL': { name: 'Alabama', pop: 5024279, metros: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'], density: 37, restrooms: 40200 },
  'FL': { name: 'Florida', pop: 21538187, metros: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Fort Lauderdale'], density: 126, restrooms: 172300 },
  'GA': { name: 'Georgia', pop: 10711908, metros: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah'], density: 70, restrooms: 85700 },
  'KY': { name: 'Kentucky', pop: 4505836, metros: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'], density: 43, restrooms: 36000 },
  'MS': { name: 'Mississippi', pop: 2961279, metros: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'], density: 24, restrooms: 23700 },
  'NC': { name: 'North Carolina', pop: 10439388, metros: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'], density: 75, restrooms: 83500 },
  'SC': { name: 'South Carolina', pop: 5118425, metros: ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant'], density: 62, restrooms: 40900 },
  'TN': { name: 'Tennessee', pop: 6910840, metros: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'], density: 63, restrooms: 55300 },
  'VA': { name: 'Virginia', pop: 8631393, metros: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'], density: 78, restrooms: 69100 },
  'WV': { name: 'West Virginia', pop: 1793716, metros: ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown'], density: 29, restrooms: 14300 },

  // NORTHEASTERN REGION
  'CT': { name: 'Connecticut', pop: 3605944, metros: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford'], density: 251, restrooms: 28800 },
  'DE': { name: 'Delaware', pop: 989948, metros: ['Wilmington', 'Dover', 'Newark', 'Middletown'], density: 154, restrooms: 7900 },
  'ME': { name: 'Maine', pop: 1395722, metros: ['Portland', 'Lewiston', 'Bangor', 'South Portland'], density: 15, restrooms: 11200 },
  'MD': { name: 'Maryland', pop: 6177224, metros: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'], density: 192, restrooms: 49400 },
  'MA': { name: 'Massachusetts', pop: 7001399, metros: ['Boston', 'Worcester', 'Springfield', 'Cambridge'], density: 256, restrooms: 56000 },
  'NH': { name: 'New Hampshire', pop: 1395231, metros: ['Manchester', 'Nashua', 'Concord', 'Derry'], density: 58, restrooms: 11200 },
  'NJ': { name: 'New Jersey', pop: 9288994, metros: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'], density: 411, restrooms: 74300 },
  'NY': { name: 'New York', pop: 20201249, metros: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'], density: 143, restrooms: 161600 },
  'PA': { name: 'Pennsylvania', pop: 13002700, metros: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'], density: 109, restrooms: 104000 },
  'RI': { name: 'Rhode Island', pop: 1097379, metros: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'], density: 274, restrooms: 8800 },
  'VT': { name: 'Vermont', pop: 643077, metros: ['Burlington', 'South Burlington', 'Rutland', 'Barre'], density: 26, restrooms: 5100 },

  // FEDERAL DISTRICT & TERRITORIES
  'DC': { name: 'District of Columbia', pop: 689545, metros: ['Washington'], density: 3897, restrooms: 5500 },
  'PR': { name: 'Puerto Rico', pop: 3285874, metros: ['San Juan', 'Bayamón', 'Carolina', 'Ponce'], density: 238, restrooms: 26300 },
  'VI': { name: 'U.S. Virgin Islands', pop: 104425, metros: ['Charlotte Amalie', 'Christiansted'], density: 55, restrooms: 800 },
  'GU': { name: 'Guam', pop: 153836, metros: ['Hagåtña', 'Tamuning'], density: 104, restrooms: 1200 },
  'AS': { name: 'American Samoa', pop: 49710, metros: ['Pago Pago'], density: 33, restrooms: 400 },
  'MP': { name: 'Northern Mariana Islands', pop: 47329, metros: ['Saipan'], density: 9, restrooms: 400 }
};

/**
 * Generate comprehensive nationwide demonstration
 */
export class AllStatesDemoService {
  /**
   * Get comprehensive data for ALL 50 states + territories
   */
  async getAllStatesDemo(centerLat: number = 39.8283, centerLng: number = -98.5795): Promise<{
    totalStates: number;
    totalRestrooms: number;
    stateBreakdown: Array<{
      code: string;
      name: string;
      restrooms: number;
      metros: string[];
      sampleFacilities: Utility[];
    }>;
    nationalSummary: {
      adaCompliant: number;
      available24h: number;
      verified: number;
      facilitySummary: { [type: string]: number };
    };
  }> {
    console.log('🇺🇸 GENERATING COMPLETE 50-STATE DEMONSTRATION...');
    
    const stateBreakdown: Array<{
      code: string;
      name: string;
      restrooms: number;
      metros: string[];
      sampleFacilities: Utility[];
    }> = [];

    let totalRestrooms = 0;
    let totalADA = 0;
    let total24h = 0;
    let totalVerified = 0;
    const facilitySummary: { [type: string]: number } = {};

    // Process all states and territories
    for (const [code, state] of Object.entries(ALL_US_STATES_COMPLETE)) {
      console.log(`🏛️ Processing ${code} (${state.name})...`);
      
      // Generate sample facilities for each state
      const sampleFacilities = this.generateStateSampleFacilities(code, state, 5); // 5 samples per state
      
      // Count facilities by type
      sampleFacilities.forEach(facility => {
        const type = this.extractFacilityType(facility.name);
        facilitySummary[type] = (facilitySummary[type] || 0) + Math.floor(state.restrooms / 100);
        
        if (facility.wheelchair_accessible) totalADA++;
        if (facility.is24Hours) total24h++;
        if (facility.verified) totalVerified++;
      });

      stateBreakdown.push({
        code,
        name: state.name,
        restrooms: state.restrooms,
        metros: state.metros,
        sampleFacilities
      });

      totalRestrooms += state.restrooms;
      console.log(`✅ ${code}: ${state.restrooms.toLocaleString()} restrooms across ${state.metros.length} metro areas`);
    }

    // Sort by restroom count (largest first)
    stateBreakdown.sort((a, b) => b.restrooms - a.restrooms);

    const result = {
      totalStates: Object.keys(ALL_US_STATES_COMPLETE).length,
      totalRestrooms,
      stateBreakdown,
      nationalSummary: {
        adaCompliant: Math.floor(totalRestrooms * 0.87), // 87% ADA compliant
        available24h: Math.floor(totalRestrooms * 0.12), // 12% available 24/7
        verified: Math.floor(totalRestrooms * 0.78), // 78% verified
        facilitySummary
      }
    };

    console.log('🎯 NATIONAL DEMONSTRATION COMPLETE:');
    console.log(`   📊 Total Coverage: ${result.totalStates} states/territories`);
    console.log(`   🚻 Total Restrooms: ${result.totalRestrooms.toLocaleString()}`);
    console.log(`   ♿ ADA Compliant: ${result.nationalSummary.adaCompliant.toLocaleString()} (87%)`);
    console.log(`   🕐 24/7 Available: ${result.nationalSummary.available24h.toLocaleString()} (12%)`);
    console.log(`   ✅ Verified: ${result.nationalSummary.verified.toLocaleString()} (78%)`);
    
    console.log('🏆 TOP 10 STATES BY RESTROOM COUNT:');
    result.stateBreakdown.slice(0, 10).forEach((state, index) => {
      console.log(`   ${index + 1}. ${state.code} (${state.name}): ${state.restrooms.toLocaleString()}`);
    });

    return result;
  }

  /**
   * Generate sample facilities for a specific state
   */
  private generateStateSampleFacilities(stateCode: string, stateData: any, count: number): Utility[] {
    const facilities: Utility[] = [];
    const facilityTypes = [
      'Gas Station', 'Restaurant', 'Shopping Center', 'Public Park', 'Library',
      'Government Building', 'Hospital', 'School', 'Transit Station', 'Hotel'
    ];

    for (let i = 0; i < count; i++) {
      const facilityType = facilityTypes[i % facilityTypes.length];
      const metro = stateData.metros[i % stateData.metros.length];
      const isADA = Math.random() < 0.87; // 87% ADA compliant
      
      facilities.push({
        id: `${stateCode.toLowerCase()}_demo_${i + 1}`,
        name: `${facilityType} - ${metro}`,
        type: 'restroom',
        category: 'restroom',
        latitude: 39.8283 + (Math.random() - 0.5) * 20, // Spread across US
        longitude: -98.5795 + (Math.random() - 0.5) * 40,
        description: `Public restroom at ${facilityType} in ${metro}, ${stateData.name}${isADA ? ' • ADA Compliant' : ''}`,
        address: `${metro}, ${stateData.name}`,
        wheelchair_accessible: isADA,
        isAccessible: isADA,
        verified: Math.random() < 0.78,
        rating: 3.2 + Math.random() * 1.8,
        rating_count: Math.floor(Math.random() * 100) + 1,
        reviewCount: Math.floor(Math.random() * 100) + 1,
        is24Hours: Math.random() < 0.12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
    }

    return facilities;
  }

  /**
   * Extract facility type from name
   */
  private extractFacilityType(name: string): string {
    const types = ['Gas Station', 'Restaurant', 'Shopping Center', 'Public Park', 'Library', 
                  'Government Building', 'Hospital', 'School', 'Transit Station', 'Hotel'];
    
    for (const type of types) {
      if (name.includes(type)) return type;
    }
    return 'Other';
  }

  /**
   * Get regional breakdown
   */
  getRegionalBreakdown(): { [region: string]: string[] } {
    return {
      'West': ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
      'Southwest': ['TX', 'OK', 'AR', 'LA'],
      'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
      'South': ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
      'Northeast': ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
      'Federal/Territories': ['DC', 'PR', 'VI', 'GU', 'AS', 'MP']
    };
  }

  /**
   * Generate demonstration for specific region
   */
  async getRegionalDemo(region: string): Promise<any> {
    const regions = this.getRegionalBreakdown();
    const stateCodes = regions[region] || [];
    
    console.log(`🌎 REGIONAL DEMO: ${region.toUpperCase()}`);
    console.log(`📍 States included: ${stateCodes.join(', ')}`);
    
    const regionalData = stateCodes.map(code => {
      const state = ALL_US_STATES_COMPLETE[code as keyof typeof ALL_US_STATES_COMPLETE];
      return state ? { code, ...state } : null;
    }).filter(Boolean);

    const totalRestrooms = regionalData.reduce((sum, state) => sum + (state?.restrooms || 0), 0);
    
    console.log(`🎯 ${region} TOTAL: ${totalRestrooms.toLocaleString()} restrooms`);
    
    return {
      region,
      states: regionalData,
      totalRestrooms,
      stateCount: stateCodes.length
    };
  }
}

// Export singleton
export const allStatesDemoService = new AllStatesDemoService(); 