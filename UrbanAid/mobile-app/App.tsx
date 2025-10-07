import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Modal, FlatList, Animated, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import * as Location from 'expo-location';

const Tab = createBottomTabNavigator();

// United States Public Utilities Data - All 50 States
const sampleUtilities = [
  // ============== NORTHEAST REGION ==============
  
  // NEW YORK
  {
    id: '1',
    type: 'restroom',
    title: 'Bryant Park Restrooms',
    description: 'Clean public restroom with accessibility features',
    coordinate: { latitude: 40.7536, longitude: -73.9832 },
    icon: '🚻',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '2',
    type: 'library',
    title: 'New York Public Library - Main',
    description: 'Iconic central library with full accessibility',
    coordinate: { latitude: 40.7532, longitude: -73.9822 },
    icon: '📚',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '3',
    type: 'water',
    title: 'Central Park Water Fountain',
    description: 'Fresh drinking water fountain in the park',
    coordinate: { latitude: 40.7829, longitude: -73.9654 },
    icon: '💧',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '4',
    type: 'transit',
    title: 'Times Square Transit Hub',
    description: 'Major subway station with accessibility',
    coordinate: { latitude: 40.7580, longitude: -73.9855 },
    icon: '🚌',
    accessibility: true,
    rating: 4.0,
  },

  // CALIFORNIA
  {
    id: '5',
    type: 'shelter',
    title: 'Los Angeles Union Rescue Mission',
    description: 'Emergency shelter with heating and cooling',
    coordinate: { latitude: 34.0479, longitude: -118.2467 },
    icon: '🏠',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '6',
    type: 'food',
    title: 'San Francisco Food Bank',
    description: 'Free food distribution center',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '7',
    type: 'wifi',
    title: 'Santa Monica Pier Wi-Fi',
    description: 'Public Wi-Fi hotspot at the pier',
    coordinate: { latitude: 34.0086, longitude: -118.4977 },
    icon: '📶',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '8',
    type: 'charging',
    title: 'LAX Airport Charging Station',
    description: 'USB charging stations throughout terminals',
    coordinate: { latitude: 33.9425, longitude: -118.4081 },
    icon: '🔋',
    accessibility: true,
    rating: 4.4,
  },

  // TEXAS
  {
    id: '9',
    type: 'clinic',
    title: 'Houston Community Health Centers',
    description: 'Federally qualified health center',
    coordinate: { latitude: 29.7604, longitude: -95.3698 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '10',
    type: 'bench',
    title: 'Austin Zilker Park Benches',
    description: 'Scenic benches overlooking the lake',
    coordinate: { latitude: 30.2672, longitude: -97.7431 },
    icon: '🪑',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '11',
    type: 'handwashing',
    title: 'Dallas Farmers Market Wash Station',
    description: 'Public handwashing station at market',
    coordinate: { latitude: 32.7767, longitude: -96.7970 },
    icon: '🧼',
    accessibility: true,
    rating: 4.3,
  },

  // FLORIDA
  {
    id: '12',
    type: 'restroom',
    title: 'Miami Beach Public Facilities',
    description: 'Beach restrooms with accessibility',
    coordinate: { latitude: 25.7617, longitude: -80.1918 },
    icon: '🚻',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '13',
    type: 'water',
    title: 'Orlando City Hall Fountain',
    description: 'Public drinking fountain downtown',
    coordinate: { latitude: 28.5383, longitude: -81.3792 },
    icon: '💧',
    accessibility: true,
    rating: 4.1,
  },
  
  // ============== SOUTHEAST REGION ==============
  
  // GEORGIA
  {
    id: '14',
    type: 'transit',
    title: 'Atlanta MARTA Five Points',
    description: 'Major transit hub in downtown Atlanta',
    coordinate: { latitude: 33.7537, longitude: -84.3918 },
    icon: '🚌',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '15',
    type: 'library',
    title: 'Atlanta Central Library',
    description: 'Main library branch with accessibility',
    coordinate: { latitude: 33.7537, longitude: -84.3863 },
    icon: '📚',
    accessibility: true,
    rating: 4.7,
  },

  // NORTH CAROLINA
  {
    id: '16',
    type: 'food',
    title: 'Charlotte Food Pantry',
    description: 'Community food distribution center',
    coordinate: { latitude: 35.2271, longitude: -80.8431 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '17',
    type: 'shelter',
    title: 'Raleigh Rescue Mission',
    description: 'Emergency shelter with climate control',
    coordinate: { latitude: 35.7796, longitude: -78.6382 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },

  // ============== MIDWEST REGION ==============
  
  // ILLINOIS
  {
    id: '18',
    type: 'restroom',
    title: 'Chicago Millennium Park',
    description: 'Public facilities in downtown park',
    coordinate: { latitude: 41.8826, longitude: -87.6226 },
    icon: '🚻',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '19',
    type: 'wifi',
    title: 'Chicago Public Library Wi-Fi',
    description: 'Free high-speed internet access',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '📶',
    accessibility: true,
    rating: 4.8,
  },

  // MICHIGAN
  {
    id: '20',
    type: 'charging',
    title: 'Detroit Renaissance Center',
    description: 'Phone charging stations in main lobby',
    coordinate: { latitude: 42.3290, longitude: -83.0400 },
    icon: '🔋',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '21',
    type: 'clinic',
    title: 'Detroit Community Health',
    description: 'Community health clinic with sliding fees',
    coordinate: { latitude: 42.3314, longitude: -83.0458 },
    icon: '🏥',
    accessibility: true,
    rating: 4.4,
  },

  // OHIO
  {
    id: '22',
    type: 'bench',
    title: 'Columbus Scioto Mile Benches',
    description: 'Riverside benches with accessibility',
    coordinate: { latitude: 39.9612, longitude: -82.9988 },
    icon: '🪑',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '23',
    type: 'handwashing',
    title: 'Cleveland Public Square',
    description: 'Hand washing station downtown',
    coordinate: { latitude: 41.4993, longitude: -81.6944 },
    icon: '🧼',
    accessibility: true,
    rating: 4.1,
  },

  // ============== WEST REGION ==============
  
  // WASHINGTON
  {
    id: '24',
    type: 'water',
    title: 'Seattle Pike Place Market',
    description: 'Water fountain at famous market',
    coordinate: { latitude: 47.6085, longitude: -122.3351 },
    icon: '💧',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '25',
    type: 'food',
    title: 'Seattle Food Lifeline',
    description: 'Regional food bank and distribution',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },

  // OREGON
  {
    id: '26',
    type: 'shelter',
    title: 'Portland Rescue Mission',
    description: 'Year-round shelter with services',
    coordinate: { latitude: 45.5152, longitude: -122.6784 },
    icon: '🏠',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '27',
    type: 'transit',
    title: 'Portland MAX Light Rail',
    description: 'Accessible light rail station',
    coordinate: { latitude: 45.5200, longitude: -122.6819 },
    icon: '🚌',
    accessibility: true,
    rating: 4.3,
  },

  // COLORADO
  {
    id: '28',
    type: 'library',
    title: 'Denver Central Library',
    description: 'Main library with full accessibility',
    coordinate: { latitude: 39.7357, longitude: -104.9919 },
    icon: '📚',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '29',
    type: 'restroom',
    title: 'Denver Union Station',
    description: 'Historic station with modern facilities',
    coordinate: { latitude: 39.7539, longitude: -105.0021 },
    icon: '🚻',
    accessibility: true,
    rating: 4.4,
  },

  // ============== SOUTHWEST REGION ==============
  
  // ARIZONA
  {
    id: '30',
    type: 'wifi',
    title: 'Phoenix Sky Harbor Airport',
    description: 'Free Wi-Fi throughout terminals',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '📶',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '31',
    type: 'charging',
    title: 'Scottsdale City Hall',
    description: 'Public charging stations available',
    coordinate: { latitude: 33.4942, longitude: -111.9261 },
    icon: '🔋',
    accessibility: true,
    rating: 4.2,
  },

  // NEW MEXICO
  {
    id: '32',
    type: 'clinic',
    title: 'Albuquerque Health Center',
    description: 'Community health services',
    coordinate: { latitude: 35.0844, longitude: -106.6504 },
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '33',
    type: 'bench',
    title: 'Santa Fe Plaza Benches',
    description: 'Historic plaza seating area',
    coordinate: { latitude: 35.6870, longitude: -105.9378 },
    icon: '🪑',
    accessibility: true,
    rating: 4.4,
  },

  // ============== MOUNTAIN REGION ==============
  
  // UTAH
  {
    id: '34',
    type: 'handwashing',
    title: 'Salt Lake City Gateway',
    description: 'Public handwashing facilities',
    coordinate: { latitude: 40.7608, longitude: -111.8910 },
    icon: '🧼',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '35',
    type: 'water',
    title: 'Temple Square Fountain',
    description: 'Public drinking fountain',
    coordinate: { latitude: 40.7701, longitude: -111.8925 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },

  // MONTANA
  {
    id: '36',
    type: 'food',
    title: 'Billings Food Bank',
    description: 'Regional food assistance center',
    coordinate: { latitude: 45.7833, longitude: -108.5007 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.5,
  },

  // ============== ADDITIONAL MAJOR STATES ==============
  
  // PENNSYLVANIA
  {
    id: '37',
    type: 'shelter',
    title: 'Philadelphia Homeless Services',
    description: 'Emergency shelter with heating/cooling',
    coordinate: { latitude: 39.9526, longitude: -75.1652 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '38',
    type: 'transit',
    title: 'Philadelphia SEPTA Center',
    description: 'Major transit hub downtown',
    coordinate: { latitude: 39.9550, longitude: -75.1605 },
    icon: '🚌',
    accessibility: true,
    rating: 4.1,
  },

  // MASSACHUSETTS
  {
    id: '39',
    type: 'library',
    title: 'Boston Public Library',
    description: 'Historic library with full services',
    coordinate: { latitude: 42.3496, longitude: -71.0746 },
    icon: '📚',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '40',
    type: 'restroom',
    title: 'Boston Common Facilities',
    description: 'Public park restrooms',
    coordinate: { latitude: 42.3551, longitude: -71.0656 },
    icon: '🚻',
    accessibility: true,
    rating: 4.3,
  },

  // VIRGINIA
  {
    id: '41',
    type: 'wifi',
    title: 'Richmond Public Library',
    description: 'Free Wi-Fi and computer access',
    coordinate: { latitude: 37.5407, longitude: -77.4360 },
    icon: '📶',
    accessibility: true,
    rating: 4.6,
  },

  // WISCONSIN
  {
    id: '42',
    type: 'charging',
    title: 'Milwaukee Public Market',
    description: 'Charging stations for visitors',
    coordinate: { latitude: 43.0389, longitude: -87.9065 },
    icon: '🔋',
    accessibility: true,
    rating: 4.3,
  },

  // MINNESOTA
  {
    id: '43',
    type: 'clinic',
    title: 'Minneapolis Community Health',
    description: 'Comprehensive health services',
    coordinate: { latitude: 44.9778, longitude: -93.2650 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },

  // LOUISIANA
  {
    id: '44',
    type: 'bench',
    title: 'New Orleans French Quarter',
    description: 'Historic district seating',
    coordinate: { latitude: 29.9511, longitude: -90.0715 },
    icon: '🪑',
    accessibility: true,
    rating: 4.4,
  },

  // TENNESSEE
  {
    id: '45',
    type: 'handwashing',
    title: 'Nashville Music City Center',
    description: 'Convention center handwashing',
    coordinate: { latitude: 36.1627, longitude: -86.7816 },
    icon: '🧼',
    accessibility: true,
    rating: 4.2,
  },

  // ALABAMA
  {
    id: '46',
    type: 'water',
    title: 'Birmingham Civil Rights District',
    description: 'Water fountain at historic site',
    coordinate: { latitude: 33.5186, longitude: -86.8104 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },

  // ALASKA
  {
    id: '47',
    type: 'food',
    title: 'Anchorage Food Bank',
    description: 'Community food assistance',
    coordinate: { latitude: 61.2181, longitude: -149.9003 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },

  // HAWAII
  {
    id: '48',
    type: 'shelter',
    title: 'Honolulu Rescue Mission',
    description: 'Island emergency shelter services',
    coordinate: { latitude: 21.3099, longitude: -157.8581 },
    icon: '🏠',
    accessibility: true,
    rating: 4.5,
  },

  // ============== KENTUCKY & ADDITIONAL COVERAGE ==============
  
  // Louisville Area
  {
    id: '49',
    type: 'restroom',
    title: 'Louisville Public Library - Main',
    description: 'Clean public restroom with accessibility features',
    coordinate: { latitude: 38.2467, longitude: -85.7585 },
    icon: '🚻',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '50',
    type: 'water',
    title: 'Waterfront Park Fountain',
    description: 'Fresh drinking water fountain by the Ohio River',
    coordinate: { latitude: 38.2588, longitude: -85.7443 },
    icon: '💧',
    accessibility: true,
    rating: 4.2,
  },

  // ============== ADDITIONAL NATIONWIDE COVERAGE ==============
  
  // More Water Fountains
  {
    id: '51',
    type: 'water',
    title: 'Las Vegas Strip Water Station',
    description: 'Hydration station on famous Las Vegas Strip',
    coordinate: { latitude: 36.1147, longitude: -115.1728 },
    icon: '💧',
    accessibility: true,
    rating: 4.0,
  },
  {
    id: '52',
    type: 'water',
    title: 'Golden Gate Park Fountain',
    description: 'Multiple water fountains throughout park',
    coordinate: { latitude: 37.7694, longitude: -122.4862 },
    icon: '💧',
    accessibility: true,
    rating: 4.4,
  },

  // More Public Restrooms
  {
    id: '53',
    type: 'restroom',
    title: 'Times Square Public Facilities',
    description: 'Public restrooms in heart of Manhattan',
    coordinate: { latitude: 40.7589, longitude: -73.9851 },
    icon: '🚻',
    accessibility: true,
    rating: 3.8,
  },
  {
    id: '54',
    type: 'restroom',
    title: 'Venice Beach Restrooms',
    description: 'Beach public facilities with accessibility',
    coordinate: { latitude: 33.9850, longitude: -118.4695 },
    icon: '🚻',
    accessibility: true,
    rating: 4.1,
  },

  // More Benches
  {
    id: '55',
    type: 'bench',
    title: 'Central Park Mall Benches',
    description: 'Historic tree-lined walkway with benches',
    coordinate: { latitude: 40.7697, longitude: -73.9735 },
    icon: '🪑',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '56',
    type: 'bench',
    title: 'Millennium Park Benches',
    description: 'Modern park seating with city views',
    coordinate: { latitude: 41.8826, longitude: -87.6226 },
    icon: '🪑',
    accessibility: true,
    rating: 4.5,
  },

  // More Handwashing Stations
  {
    id: '57',
    type: 'handwashing',
    title: 'Union Station Hand Wash - DC',
    description: 'Main transportation hub handwashing',
    coordinate: { latitude: 38.8977, longitude: -77.0365 },
    icon: '🧼',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '58',
    type: 'handwashing',
    title: 'Pike Place Market Seattle',
    description: 'Market handwashing facilities',
    coordinate: { latitude: 47.6085, longitude: -122.3351 },
    icon: '🧼',
    accessibility: true,
    rating: 4.2,
  },

  // More Cooling/Warming Shelters
  {
    id: '59',
    type: 'shelter',
    title: 'Chicago Warming Centers',
    description: 'Network of emergency warming shelters',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '60',
    type: 'shelter',
    title: 'Phoenix Cooling Centers',
    description: 'Summer heat relief cooling centers',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },

  // More Free Food Locations
  {
    id: '61',
    type: 'food',
    title: 'DC Central Kitchen',
    description: 'Community meals and food distribution',
    coordinate: { latitude: 38.9072, longitude: -77.0369 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '62',
    type: 'food',
    title: 'LA Food Bank Distribution',
    description: 'Large-scale food assistance program',
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },

  // More Public Wi-Fi
  {
    id: '63',
    type: 'wifi',
    title: 'NYC LinkNYC Kiosks',
    description: 'Free gigabit Wi-Fi throughout NYC',
    coordinate: { latitude: 40.7506, longitude: -73.9861 },
    icon: '📶',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '64',
    type: 'wifi',
    title: 'Starbucks Universal Wi-Fi',
    description: 'Free Wi-Fi at coffee locations nationwide',
    coordinate: { latitude: 47.6205, longitude: -122.3493 },
    icon: '📶',
    accessibility: true,
    rating: 4.4,
  },

  // More Phone Charging Stations
  {
    id: '65',
    type: 'charging',
    title: 'Airport Charging Hubs',
    description: 'Universal charging stations at major airports',
    coordinate: { latitude: 33.6367, longitude: -84.4281 }, // Atlanta Airport
    icon: '🔋',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '66',
    type: 'charging',
    title: 'Mall of America Charging',
    description: 'Shopping center charging stations',
    coordinate: { latitude: 44.8548, longitude: -93.2422 },
    icon: '🔋',
    accessibility: true,
    rating: 4.2,
  },

  // More Transit Stops
  {
    id: '67',
    type: 'transit',
    title: 'Grand Central Terminal',
    description: 'Major NYC transportation hub',
    coordinate: { latitude: 40.7527, longitude: -73.9772 },
    icon: '🚌',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '68',
    type: 'transit',
    title: 'San Francisco BART',
    description: 'Bay Area rapid transit system',
    coordinate: { latitude: 37.7893, longitude: -122.4013 },
    icon: '🚌',
    accessibility: true,
    rating: 4.2,
  },

  // More Public Libraries
  {
    id: '69',
    type: 'library',
    title: 'Library of Congress',
    description: 'National library with public access',
    coordinate: { latitude: 38.8886, longitude: -77.0047 },
    icon: '📚',
    accessibility: true,
    rating: 4.9,
  },
  {
    id: '70',
    type: 'library',
    title: 'Los Angeles Central Library',
    description: 'Historic downtown library',
    coordinate: { latitude: 34.0522, longitude: -118.2551 },
    icon: '📚',
    accessibility: true,
    rating: 4.6,
  },

  // More Community Clinics
  {
    id: '71',
    type: 'clinic',
    title: 'Federally Qualified Health Centers',
    description: 'Community health services nationwide',
    coordinate: { latitude: 40.7282, longitude: -73.9942 }, // NYC
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '72',
    type: 'clinic',
    title: 'Rural Health Clinics',
    description: 'Healthcare access in underserved areas',
    coordinate: { latitude: 44.2619, longitude: -72.5806 }, // Vermont
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },

  // Additional State Coverage

  // NEVADA
  {
    id: '73',
    type: 'restroom',
    title: 'Reno Public Library',
    description: 'Downtown library with public facilities',
    coordinate: { latitude: 39.5296, longitude: -119.8138 },
    icon: '🚻',
    accessibility: true,
    rating: 4.2,
  },

  // IDAHO
  {
    id: '74',
    type: 'water',
    title: 'Boise River Greenbelt',
    description: 'Water fountains along bike path',
    coordinate: { latitude: 43.6150, longitude: -116.2023 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },

  // WYOMING
  {
    id: '75',
    type: 'bench',
    title: 'Cheyenne Frontier Park',
    description: 'Rodeo grounds with public seating',
    coordinate: { latitude: 41.1400, longitude: -104.8197 },
    icon: '🪑',
    accessibility: true,
    rating: 4.1,
  },

  // NORTH DAKOTA
  {
    id: '76',
    type: 'shelter',
    title: 'Fargo Homeless Shelter',
    description: 'Emergency shelter services',
    coordinate: { latitude: 46.8772, longitude: -96.7898 },
    icon: '🏠',
    accessibility: true,
    rating: 4.2,
  },

  // SOUTH DAKOTA
  {
    id: '77',
    type: 'food',
    title: 'Sioux Falls Food Pantry',
    description: 'Community food assistance',
    coordinate: { latitude: 43.5460, longitude: -96.7313 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.4,
  },

  // NEBRASKA
  {
    id: '78',
    type: 'wifi',
    title: 'Omaha Public Library',
    description: 'Free internet access downtown',
    coordinate: { latitude: 41.2565, longitude: -95.9345 },
    icon: '📶',
    accessibility: true,
    rating: 4.5,
  },

  // KANSAS
  {
    id: '79',
    type: 'charging',
    title: 'Wichita Airport Charging',
    description: 'Regional airport charging stations',
    coordinate: { latitude: 37.6499, longitude: -97.4331 },
    icon: '🔋',
    accessibility: true,
    rating: 4.1,
  },

  // OKLAHOMA
  {
    id: '80',
    type: 'transit',
    title: 'Oklahoma City EMBARK',
    description: 'Public transit system',
    coordinate: { latitude: 35.4676, longitude: -97.5164 },
    icon: '🚌',
    accessibility: true,
    rating: 4.0,
  },

  // ARKANSAS
  {
    id: '81',
    type: 'library',
    title: 'Little Rock Central Library',
    description: 'Main library branch',
    coordinate: { latitude: 34.7465, longitude: -92.2896 },
    icon: '📚',
    accessibility: true,
    rating: 4.4,
  },

  // MISSOURI
  {
    id: '82',
    type: 'clinic',
    title: 'St. Louis Community Health',
    description: 'Urban health services',
    coordinate: { latitude: 38.6270, longitude: -90.1994 },
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },

  // IOWA
  {
    id: '83',
    type: 'handwashing',
    title: 'Des Moines Farmers Market',
    description: 'Weekly market handwashing station',
    coordinate: { latitude: 41.5868, longitude: -93.6250 },
    icon: '🧼',
    accessibility: true,
    rating: 4.2,
  },

  // VERMONT
  {
    id: '84',
    type: 'water',
    title: 'Burlington Waterfront',
    description: 'Lake Champlain water fountain',
    coordinate: { latitude: 44.4759, longitude: -73.2121 },
    icon: '💧',
    accessibility: true,
    rating: 4.5,
  },

  // NEW HAMPSHIRE
  {
    id: '85',
    type: 'restroom',
    title: 'Manchester City Hall',
    description: 'Public facilities downtown',
    coordinate: { latitude: 42.9956, longitude: -71.4548 },
    icon: '🚻',
    accessibility: true,
    rating: 4.1,
  },

  // MAINE
  {
    id: '86',
    type: 'bench',
    title: 'Portland Head Light Park',
    description: 'Lighthouse park with scenic benches',
    coordinate: { latitude: 43.6591, longitude: -70.2568 },
    icon: '🪑',
    accessibility: true,
    rating: 4.8,
  },

  // RHODE ISLAND
  {
    id: '87',
    type: 'shelter',
    title: 'Providence Emergency Shelter',
    description: 'Year-round shelter services',
    coordinate: { latitude: 41.8240, longitude: -71.4128 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },

  // CONNECTICUT
  {
    id: '88',
    type: 'food',
    title: 'Hartford Food Bank',
    description: 'Regional food distribution',
    coordinate: { latitude: 41.7658, longitude: -72.6734 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },

  // NEW JERSEY
  {
    id: '89',
    type: 'wifi',
    title: 'Newark Public Library',
    description: 'Free Wi-Fi and computer access',
    coordinate: { latitude: 40.7357, longitude: -74.1724 },
    icon: '📶',
    accessibility: true,
    rating: 4.4,
  },

  // DELAWARE
  {
    id: '90',
    type: 'charging',
    title: 'Wilmington Train Station',
    description: 'Amtrak station charging areas',
    coordinate: { latitude: 39.7391, longitude: -75.5398 },
    icon: '🔋',
    accessibility: true,
    rating: 4.2,
  },

  // MARYLAND
  {
    id: '91',
    type: 'transit',
    title: 'Baltimore Metro',
    description: 'Public transportation hub',
    coordinate: { latitude: 39.2904, longitude: -76.6122 },
    icon: '🚌',
    accessibility: true,
    rating: 4.1,
  },

  // WEST VIRGINIA
  {
    id: '92',
    type: 'library',
    title: 'Charleston Public Library',
    description: 'State capital library services',
    coordinate: { latitude: 38.3498, longitude: -81.6326 },
    icon: '📚',
    accessibility: true,
    rating: 4.3,
  },

  // SOUTH CAROLINA
  {
    id: '93',
    type: 'clinic',
    title: 'Charleston Community Health',
    description: 'Coastal healthcare services',
    coordinate: { latitude: 32.7767, longitude: -79.9311 },
    icon: '🏥',
    accessibility: true,
    rating: 4.4,
  },

  // MISSISSIPPI
  {
    id: '94',
    type: 'handwashing',
    title: 'Jackson State Fair Grounds',
    description: 'Event venue handwashing stations',
    coordinate: { latitude: 32.2988, longitude: -90.1848 },
    icon: '🧼',
    accessibility: true,
    rating: 4.0,
  },

  // INDIANA
  {
    id: '95',
    type: 'water',
    title: 'Indianapolis Motor Speedway',
    description: 'Racing venue water stations',
    coordinate: { latitude: 39.7950, longitude: -86.2350 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },
];

// Custom Dropdown Component
const CustomDropdown = ({ 
  options, 
  onSelect, 
  placeholder, 
  style = {} 
}: {
  options: { label: string; value: string; icon?: string }[];
  onSelect: (value: string) => void;
  placeholder: string;
  style?: any;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [animation] = useState(new Animated.Value(0));

  const toggleDropdown = () => {
    if (isVisible) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    } else {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelect = (option: { label: string; value: string; icon?: string }) => {
    setSelected(option.label);
    onSelect(option.value);
    toggleDropdown();
  };

  return (
    <View style={[styles.dropdownContainer, style]}>
      <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
        <Text style={styles.dropdownButtonText}>
          {selected || placeholder}
        </Text>
        <Text style={[styles.dropdownArrow, { transform: [{ rotate: isVisible ? '180deg' : '0deg' }] }]}>
          ▼
        </Text>
      </TouchableOpacity>
      
      {isVisible && (
        <Modal transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={toggleDropdown}
          >
            <View style={styles.dropdownModal}>
              <Animated.View 
                style={[
                  styles.dropdownList,
                  {
                    opacity: animation,
                    transform: [{
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      }),
                    }],
                  }
                ]}
              >
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => handleSelect(item)}
                    >
                      {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
                      <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

// Interactive Map Screen with Real Location Services
const MapScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [utilities, setUtilities] = useState(sampleUtilities);
  const [selectedUtilityType, setSelectedUtilityType] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('2');
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 39.8283, // Center of United States (Kansas)
    longitude: -98.5795,
    latitudeDelta: 25.0, // Show entire United States
    longitudeDelta: 35.0,
  });
  const [locationPermission, setLocationPermission] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Automatically show all utilities when map is ready
  useEffect(() => {
    if (isMapReady && utilities.length > 0) {
      // Small delay to ensure map is fully loaded
      setTimeout(() => {
        showAllUtilities();
      }, 1000);
    }
  }, [isMapReady, utilities.length]);

  const requestLocationPermission = async () => {
    try {
      // Request permission using Expo Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Location Permission',
          'Please enable location services to see nearby utilities on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Get current position using Expo Location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(userLocation);

      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMapRegion(newRegion);

      // Center map on user location with workaround for centering issues
      if (mapRef.current && isMapReady) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }, 500);
      }

      console.log('User location:', userLocation);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const utilityTypes = [
    { label: 'All Utilities', value: 'all', icon: '🏙️' },
    { label: 'Restrooms', value: 'restroom', icon: '🚻' },
    { label: 'Water Fountains', value: 'water', icon: '💧' },
    { label: 'Wi-Fi Hotspots', value: 'wifi', icon: '📶' },
    { label: 'Phone Charging', value: 'charging', icon: '🔋' },
    { label: 'Benches', value: 'bench', icon: '🪑' },
    { label: 'Handwashing', value: 'handwashing', icon: '🧼' },
    { label: 'Shelters', value: 'shelter', icon: '🏠' },
    { label: 'Free Food', value: 'food', icon: '🍽️' },
    { label: 'Transit Stops', value: 'transit', icon: '🚌' },
    { label: 'Libraries', value: 'library', icon: '📚' },
    { label: 'Clinics', value: 'clinic', icon: '🏥' },
  ];

  const distanceOptions = [
    { label: 'Within 0.5 km', value: '0.5', icon: '📍' },
    { label: 'Within 1 km', value: '1', icon: '📍' },
    { label: 'Within 2 km', value: '2', icon: '📍' },
    { label: 'Within 5 km', value: '5', icon: '📍' },
  ];

  const filteredUtilities = utilities.filter(utility => {
    if (selectedUtilityType === 'all') return true;
    return utility.type === selectedUtilityType;
  });

  const handleMarkerPress = (utility: any) => {
    Alert.alert(
      utility.title,
      `${utility.description}\n\nRating: ${'⭐'.repeat(Math.floor(utility.rating))} ${utility.rating}/5\nAccessible: ${utility.accessibility ? '♿ Yes' : '❌ No'}`,
      [
        { text: 'Get Directions', onPress: () => console.log('Get directions to', utility.title) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const centerOnUserLocation = () => {
    if (currentLocation && mapRef.current) {
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
      Alert.alert('Location', 'Centered on your location');
    } else if (locationPermission !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestLocationPermission }
        ]
      );
    } else {
      getCurrentLocation();
    }
  };

  const showAllUtilities = () => {
    if (mapRef.current && filteredUtilities.length > 0) {
      // Extract coordinates from filtered utilities
      const coordinates = filteredUtilities.map(utility => ({
        latitude: utility.coordinate.latitude,
        longitude: utility.coordinate.longitude,
      }));

      // Add current location to the coordinates if available
      if (currentLocation) {
        coordinates.push({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }

      // Use setTimeout to ensure map is ready, based on GitHub issue solution
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 200,
            left: 50,
          },
          animated: true,
        });
      }, 300);

      const utilityCount = filteredUtilities.length;
      const typeText = selectedUtilityType === 'all' ? 'utilities' : `${selectedUtilityType} facilities`;
      Alert.alert(
        'Showing All Utilities', 
        `Displaying ${utilityCount} ${typeText} across the United States`
      );
    } else {
      Alert.alert('No Utilities', 'No utilities found to display on the map');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Clean Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Nearby Utilities</Text>
        <Text style={styles.screenSubtitle}>Find what you need around you</Text>
      </View>

      {/* Quick Filters */}
      <View style={styles.filterSection}>
        <CustomDropdown
          options={utilityTypes}
          onSelect={(value) => {
            setSelectedUtilityType(value);
            console.log('Selected utility:', value);
          }}
          placeholder="Select Utility Type"
          style={styles.filterDropdown}
        />
        
        <CustomDropdown
          options={distanceOptions}
          onSelect={(value) => {
            setSelectedDistance(value);
            console.log('Selected distance:', value);
          }}
          placeholder="Select Distance"
          style={styles.filterDropdown}
        />
      </View>

      {/* Real Google Maps with Location */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
          loadingIndicatorColor="#007AFF"
          loadingBackgroundColor="#F7F7F7"
          onMapReady={() => {
            setIsMapReady(true);
            // Apply workaround for centering issues
            if (currentLocation) {
              setTimeout(() => {
                const region = {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                mapRef.current?.animateToRegion(region, 1000);
              }, 1000);
            }
          }}
          paddingAdjustmentBehavior={isMapReady ? 'never' : undefined}
        >
          {/* User Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="You are here"
            >
              <View style={styles.userMarkerContainer}>
                <View style={styles.userMarkerBubble}>
                  <Text style={styles.userMarkerIcon}>📍</Text>
                </View>
              </View>
            </Marker>
          )}

          {/* Utility Markers */}
          {filteredUtilities.map((utility) => (
            <Marker
              key={utility.id}
              coordinate={utility.coordinate}
              title={utility.title}
              description={utility.description}
              onPress={() => handleMarkerPress(utility)}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.markerBubble,
                  { backgroundColor: utility.accessibility ? '#34C759' : '#FF9500' }
                ]}>
                  <Text style={styles.markerIcon}>{utility.icon}</Text>
                </View>
                {utility.accessibility && (
                  <View style={styles.accessibilityBadge}>
                    <Text style={styles.accessibilityIcon}>♿</Text>
                  </View>
                )}
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={centerOnUserLocation}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>My Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={showAllUtilities}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionLabel}>Show All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction} 
          onPress={() => {
            const accessibleUtilities = utilities.filter(u => u.accessibility);
            setUtilities(selectedUtilityType === 'accessible' ? sampleUtilities : accessibleUtilities);
            console.log('Accessibility filter toggled');
          }}
        >
          <Text style={styles.actionIcon}>♿</Text>
          <Text style={styles.actionLabel}>Accessible</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Simplified Search Screen
const SearchScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const searchTypes = [
    { label: 'By Location', value: 'location', icon: '📍' },
    { label: 'By Utility Type', value: 'type', icon: '🏢' },
    { label: 'By Accessibility', value: 'accessibility', icon: '♿' },
    { label: 'By Rating', value: 'rating', icon: '⭐' },
  ];

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Search...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Search & Filter</Text>
        <Text style={styles.screenSubtitle}>Find exactly what you need</Text>
      </View>

      <View style={styles.searchSection}>
        <CustomDropdown
          options={searchTypes}
          onSelect={(value) => console.log('Search by:', value)}
          placeholder="Choose Search Method"
          style={styles.fullWidthDropdown}
        />
      </View>

      {/* Recent Searches */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        <View style={styles.recentItem}>
          <Text style={styles.recentIcon}>🚻</Text>
          <Text style={styles.recentText}>Restrooms near downtown Louisville</Text>
        </View>
        <View style={styles.recentItem}>
          <Text style={styles.recentIcon}>💧</Text>
          <Text style={styles.recentText}>Water fountains within 1km</Text>
        </View>
        <View style={styles.recentItem}>
          <Text style={styles.recentIcon}>🍽️</Text>
          <Text style={styles.recentText}>Free food locations in Lexington</Text>
        </View>
        <View style={styles.recentItem}>
          <Text style={styles.recentIcon}>🏥</Text>
          <Text style={styles.recentText}>Community clinics accessible</Text>
        </View>
      </View>
    </View>
  );
};

// Simplified Add Screen
const AddScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const utilityTypes = [
    { label: 'Public Restroom', value: 'restroom', icon: '🚻' },
    { label: 'Water Fountain', value: 'water', icon: '💧' },
    { label: 'Wi-Fi Hotspot', value: 'wifi', icon: '📶' },
    { label: 'Phone Charging Station', value: 'charging', icon: '🔋' },
    { label: 'Public Bench', value: 'bench', icon: '🪑' },
    { label: 'Handwashing Station', value: 'handwashing', icon: '🧼' },
    { label: 'Cooling/Warming Shelter', value: 'shelter', icon: '🏠' },
    { label: 'Free Food Location', value: 'food', icon: '🍽️' },
    { label: 'Transit Stop', value: 'transit', icon: '🚌' },
    { label: 'Public Library', value: 'library', icon: '📚' },
    { label: 'Community Clinic', value: 'clinic', icon: '🏥' },
  ];

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Add New Utility</Text>
        <Text style={styles.screenSubtitle}>Help others discover useful places</Text>
      </View>

      <View style={styles.addForm}>
        <CustomDropdown
          options={utilityTypes}
          onSelect={(value) => console.log('Adding utility:', value)}
          placeholder="Select Utility Type"
          style={styles.formDropdown}
        />

        <TouchableOpacity style={styles.locationButton} onPress={() => console.log('Add location')}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>Add Location</Text>
          <Text style={styles.locationHint}>Tap to set on map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Simplified Profile Screen
const ProfileScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const themeOptions = [
    { label: 'System Default', value: 'system', icon: '⚙️' },
    { label: 'Light Theme', value: 'light', icon: '☀️' },
    { label: 'Dark Theme', value: 'dark', icon: '🌙' },
  ];

  const languageOptions = [
    { label: 'English', value: 'en', icon: '🇺🇸' },
    { label: 'Español', value: 'es', icon: '🇪🇸' },
    { label: 'Français', value: 'fr', icon: '🇫🇷' },
    { label: 'हिन्दी', value: 'hi', icon: '🇮🇳' },
    { label: 'العربية', value: 'ar', icon: '🇸🇦' },
  ];

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>Customize your experience</Text>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingLabel}>Appearance</Text>
        <CustomDropdown
          options={themeOptions}
          onSelect={(value) => console.log('Theme changed:', value)}
          placeholder="Choose Theme"
          style={styles.settingDropdown}
        />

        <Text style={styles.settingLabel}>Language</Text>
        <CustomDropdown
          options={languageOptions}
          onSelect={(value) => console.log('Language changed:', value)}
          placeholder="Choose Language"
          style={styles.settingDropdown}
        />
      </View>
    </View>
  );
};

/**
 * Custom Tab Navigator with Apple-inspired design
 */
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, 5),
          height: 60 + Math.max(insets.bottom, 0),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main App component with Apple/Microsoft design principles
 */
const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        setIsReady(true);
        console.log('UrbanAid initialized with real location services...');
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <PaperProvider>
        <SafeAreaProvider>
          <View style={styles.loadingScreen}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Initializing UrbanAid...</Text>
          </View>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  // Screen Layout
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  
  // Headers
  header: {
    marginBottom: 30,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },

  // Custom Dropdown Styles
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1D1D1F',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '90%',
    maxHeight: '70%',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E7',
  },
  optionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1D1D1F',
    fontWeight: '500',
  },

  // Map Section
  mapContainer: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  map: {
    flex: 1,
  },

  // Custom Markers
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  accessibilityBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  accessibilityIcon: {
    fontSize: 8,
    color: '#FFFFFF',
  },

  // User Location Marker
  userMarkerContainer: {
    alignItems: 'center',
  },
  userMarkerBubble: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  userMarkerIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Filter Section
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterDropdown: {
    flex: 1,
    marginHorizontal: 5,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Search Screen
  searchSection: {
    marginBottom: 30,
  },
  fullWidthDropdown: {
    width: '100%',
  },
  recentSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 15,
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recentIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recentText: {
    fontSize: 16,
    color: '#1D1D1F',
    fontWeight: '500',
  },

  // Add Screen
  addForm: {
    marginTop: 20,
  },
  formDropdown: {
    marginBottom: 20,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  locationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Settings Screen
  settingsSection: {
    marginTop: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 10,
    marginTop: 20,
  },
  settingDropdown: {
    marginBottom: 10,
  },

  // Tab Bar
  tabIcon: {
    fontSize: 20,
  },
});

export default App; 