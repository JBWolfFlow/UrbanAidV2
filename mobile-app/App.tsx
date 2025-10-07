import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Modal, FlatList, Animated, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import * as Location from 'expo-location';
import { PerformanceMarker } from './src/components/PerformanceMarker';
import { UtilityCategory, UtilityType } from './src/types/utility';

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
    coordinate: { latitude: 40.7701, longitude: -111.8910 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },

  // ============== ESSENTIAL FREE SERVICES - MAJOR CITIES ==============
  
  // NEW YORK CITY - COMPREHENSIVE FREE RESOURCES
  {
    id: '36',
    type: 'food',
    title: 'Bowery Mission Food Program',
    description: 'Free meals, no questions asked, 7 days/week',
    coordinate: { latitude: 40.7205, longitude: -73.9939 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '37',
    type: 'shower',
    title: 'BRC Homeless Services Shower',
    description: 'Free showers, toiletries, clean clothes',
    coordinate: { latitude: 40.7282, longitude: -73.9942 },
    icon: '🚿',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '38',
    type: 'laundry',
    title: 'Coalition for the Homeless Laundry',
    description: 'Free laundry facilities and detergent',
    coordinate: { latitude: 40.7505, longitude: -73.9934 },
    icon: '🧺',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '39',
    type: 'medical',
    title: 'NYC Free Clinic Network',
    description: 'No-cost medical care, walk-ins welcome',
    coordinate: { latitude: 40.7589, longitude: -73.9851 },
    icon: '⚕️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '40',
    type: 'legal',
    title: 'Legal Aid Society NYC',
    description: 'Free legal assistance for low-income residents',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    icon: '⚖️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '41',
    type: 'wifi',
    title: 'LinkNYC Kiosk - Times Square',
    description: 'Ultra-fast free WiFi, USB charging, phone calls',
    coordinate: { latitude: 40.7580, longitude: -73.9855 },
    icon: '📶',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '42',
    type: 'social_services',
    title: 'NYC Human Resources Admin',
    description: 'SNAP, Medicaid, cash assistance applications',
    coordinate: { latitude: 40.7359, longitude: -73.9911 },
    icon: '🏛️',
    accessibility: true,
    rating: 4.2,
  },

  // LOS ANGELES - COMPREHENSIVE FREE RESOURCES
  {
    id: '43',
    type: 'shower',
    title: 'Downtown Women\'s Center Hygiene',
    description: 'Free showers, hygiene supplies for women',
    coordinate: { latitude: 34.0407, longitude: -118.2468 },
    icon: '🚿',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '44',
    type: 'food',
    title: 'Midnight Mission Meals',
    description: '3 free meals daily, 365 days/year',
    coordinate: { latitude: 34.0407, longitude: -118.2437 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '45',
    type: 'medical',
    title: 'Venice Family Clinic',
    description: 'Free healthcare regardless of insurance status',
    coordinate: { latitude: 34.0195, longitude: -118.4912 },
    icon: '⚕️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '46',
    type: 'laundry',
    title: 'Laundry Love Los Angeles',
    description: 'Free laundry service monthly',
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    icon: '🧺',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '47',
    type: 'job_training',
    title: 'LA Job Center Career Services',
    description: 'Free job training, resume help, computer access',
    coordinate: { latitude: 34.0407, longitude: -118.2468 },
    icon: '💼',
    accessibility: true,
    rating: 4.4,
  },

  // CHICAGO - COMPREHENSIVE FREE RESOURCES
  {
    id: '48',
    type: 'food',
    title: 'Chicago Food Depository',
    description: 'Emergency food assistance, mobile pantries',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '49',
    type: 'warming_center',
    title: 'Chicago Warming Centers',
    description: 'Emergency overnight shelter when temp drops',
    coordinate: { latitude: 41.8781, longitude: -87.6350 },
    icon: '🔥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '50',
    type: 'mental_health',
    title: 'NAMI Chicago Support Groups',
    description: 'Free mental health support groups',
    coordinate: { latitude: 41.8708, longitude: -87.6505 },
    icon: '🧠',
    accessibility: true,
    rating: 4.6,
  },

  // PHOENIX - COMPREHENSIVE FREE RESOURCES  
  {
    id: '51',
    type: 'cooling_center',
    title: 'Phoenix Cooling Centers',
    description: 'Free AC during extreme heat warnings',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '❄️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '52',
    type: 'water',
    title: 'Phoenix Heat Relief Stations',
    description: 'Free cold water and electrolyte drinks',
    coordinate: { latitude: 33.4734, longitude: -112.0407 },
    icon: '💧',
    accessibility: true,
    rating: 4.8,
  },

  // SEATTLE - COMPREHENSIVE FREE RESOURCES
  {
    id: '53',
    type: 'needle_exchange',
    title: 'Seattle Needle Exchange',
    description: 'Harm reduction services, clean supplies',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
    icon: '💉',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '54',
    type: 'food',
    title: 'Seattle Union Gospel Mission',
    description: 'Free meals, no preaching required',
    coordinate: { latitude: 47.5994, longitude: -122.3277 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },

  // PORTLAND - COMPREHENSIVE FREE RESOURCES
  {
    id: '55',
    type: 'shower',
    title: 'Portland Hygiene Access',
    description: 'Mobile shower units, rotating locations',
    coordinate: { latitude: 45.5152, longitude: -122.6784 },
    icon: '🚿',
    accessibility: true,
    rating: 4.6,
  },

  // HOUSTON - COMPREHENSIVE FREE RESOURCES
  {
    id: '56',
    type: 'food',
    title: 'Houston Food Bank Distribution',
    description: 'Largest food distribution in Texas',
    coordinate: { latitude: 29.7604, longitude: -95.3698 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '57',
    type: 'disaster_relief',
    title: 'Houston Hurricane Shelter',
    description: 'Emergency shelter during storms',
    coordinate: { latitude: 29.7866, longitude: -95.3909 },
    icon: '🌪️',
    accessibility: true,
    rating: 4.4,
  },

  // DENVER - COMPREHENSIVE FREE RESOURCES
  {
    id: '58',
    type: 'food',
    title: 'Denver Rescue Mission',
    description: 'Free meals, emergency services',
    coordinate: { latitude: 39.7392, longitude: -104.9903 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '59',
    type: 'clothing',
    title: 'Denver Clothing Bank',
    description: 'Free clothes for all ages and sizes',
    coordinate: { latitude: 39.7391, longitude: -104.9847 },
    icon: '👕',
    accessibility: true,
    rating: 4.5,
  },

  // ATLANTA - COMPREHENSIVE FREE RESOURCES
  {
    id: '60',
    type: 'food',
    title: 'Atlanta Community Food Bank',
    description: 'Emergency food assistance, mobile markets',
    coordinate: { latitude: 33.7490, longitude: -84.3880 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },

  // MIAMI - COMPREHENSIVE FREE RESOURCES
  {
    id: '61',
    type: 'hurricane_shelter',
    title: 'Miami-Dade Hurricane Shelter',
    description: 'Emergency shelter during hurricane season',
    coordinate: { latitude: 25.7617, longitude: -80.1918 },
    icon: '🌀',
    accessibility: true,
    rating: 4.3,
  },

  // BOSTON - COMPREHENSIVE FREE RESOURCES
  {
    id: '62',
    type: 'food',
    title: 'Boston Food Pantry Network',
    description: 'Emergency food assistance throughout city',
    coordinate: { latitude: 42.3601, longitude: -71.0589 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '63',
    type: 'medical',
    title: 'Boston Health Care for Homeless',
    description: 'Medical care for uninsured individuals',
    coordinate: { latitude: 42.3551, longitude: -71.0656 },
    icon: '⚕️',
    accessibility: true,
    rating: 4.7,
  },

  // DETROIT - COMPREHENSIVE FREE RESOURCES
  {
    id: '64',
    type: 'food',
    title: 'Gleaners Food Bank Detroit',
    description: 'Emergency food distribution center',
    coordinate: { latitude: 42.3314, longitude: -83.0458 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '65',
    type: 'job_training',
    title: 'Detroit Employment Solutions',
    description: 'Free job placement and training programs',
    coordinate: { latitude: 42.3314, longitude: -83.0400 },
    icon: '💼',
    accessibility: true,
    rating: 4.4,
  },

  // SAN FRANCISCO - COMPREHENSIVE FREE RESOURCES
  {
    id: '66',
    type: 'shower',
    title: 'Lava Mae Mobile Showers',
    description: 'Mobile shower and toilet facilities',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    icon: '🚿',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '67',
    type: 'safe_injection',
    title: 'SF Safe Injection Site',
    description: 'Supervised consumption, harm reduction',
    coordinate: { latitude: 37.7849, longitude: -122.4094 },
    icon: '💉',
    accessibility: true,
    rating: 4.2,
  },

  // ============== SPECIALIZED ESSENTIAL SERVICES ==============
  
  // UNIVERSAL BASIC NEEDS
  {
    id: '68',
    type: 'water',
    title: 'Emergency Water Distribution',
    description: 'Free bottled water during emergencies',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    icon: '💧',
    accessibility: true,
    rating: 4.9,
  },
  {
    id: '69',
    type: 'pet_services',
    title: 'Free Pet Food Bank',
    description: 'Pet food for families in need',
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    icon: '🐕',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '70',
    type: 'baby_needs',
    title: 'Diaper Bank Distribution',
    description: 'Free diapers, formula, baby supplies',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '👶',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '71',
    type: 'eye_care',
    title: 'Free Eye Clinic',
    description: 'Vision exams, glasses for low-income',
    coordinate: { latitude: 29.7604, longitude: -95.3698 },
    icon: '👓',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '72',
    type: 'dental',
    title: 'Community Dental Clinic',
    description: 'Free dental care, emergency services',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '🦷',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '73',
    type: 'tax_help',
    title: 'VITA Tax Preparation',
    description: 'Free tax preparation for low-income',
    coordinate: { latitude: 39.7392, longitude: -104.9903 },
    icon: '📋',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '74',
    type: 'internet',
    title: 'Community Computer Center',
    description: 'Free internet, computer training',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
    icon: '💻',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '75',
    type: 'haircut',
    title: 'Haircuts for Homeless',
    description: 'Free haircuts, grooming services',
    coordinate: { latitude: 45.5152, longitude: -122.6784 },
    icon: '✂️',
    accessibility: true,
    rating: 4.7,
  },

  // CRISIS SUPPORT SERVICES
  {
    id: '76',
    type: 'suicide_prevention',
    title: '988 Crisis Center Location',
    description: 'In-person crisis intervention services',
    coordinate: { latitude: 40.7589, longitude: -73.9851 },
    icon: '☎️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '77',
    type: 'domestic_violence',
    title: 'DV Safe House Location',
    description: 'Emergency shelter for domestic violence survivors',
    coordinate: { latitude: 34.0407, longitude: -118.2468 },
    icon: '🏠',
    accessibility: true,
    rating: 4.9,
  },
  {
    id: '78',
    type: 'addiction_services',
    title: 'Free Addiction Recovery Center',
    description: 'Detox, counseling, support groups',
    coordinate: { latitude: 41.8781, longitude: -87.6350 },
    icon: '🔄',
    accessibility: true,
    rating: 4.6,
  },

  // MONTANA
  {
    id: '79',
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
    id: '80',
    type: 'shelter',
    title: 'Philadelphia Homeless Services',
    description: 'Emergency shelter with heating/cooling',
    coordinate: { latitude: 39.9526, longitude: -75.1652 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '81',
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
    id: '82',
    type: 'library',
    title: 'Boston Public Library',
    description: 'Historic library with full services',
    coordinate: { latitude: 42.3496, longitude: -71.0746 },
    icon: '📚',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '83',
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
    id: '84',
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
    id: '85',
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
    id: '86',
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
    id: '87',
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
    id: '88',
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
    id: '89',
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
    id: '90',
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
    id: '91',
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
    id: '92',
    type: 'restroom',
    title: 'Louisville Public Library - Main',
    description: 'Clean public restroom with accessibility features',
    coordinate: { latitude: 38.2467, longitude: -85.7585 },
    icon: '🚻',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '93',
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
    id: '94',
    type: 'water',
    title: 'Las Vegas Strip Water Station',
    description: 'Hydration station on famous Las Vegas Strip',
    coordinate: { latitude: 36.1147, longitude: -115.1728 },
    icon: '💧',
    accessibility: true,
    rating: 4.0,
  },
  {
    id: '95',
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
    id: '96',
    type: 'restroom',
    title: 'Times Square Public Facilities',
    description: 'Public restrooms in heart of Manhattan',
    coordinate: { latitude: 40.7589, longitude: -73.9851 },
    icon: '🚻',
    accessibility: true,
    rating: 3.8,
  },
  {
    id: '97',
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
    id: '98',
    type: 'bench',
    title: 'Central Park Mall Benches',
    description: 'Historic tree-lined walkway with benches',
    coordinate: { latitude: 40.7697, longitude: -73.9735 },
    icon: '🪑',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '99',
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
    id: '100',
    type: 'handwashing',
    title: 'Union Station Hand Wash - DC',
    description: 'Main transportation hub handwashing',
    coordinate: { latitude: 38.8977, longitude: -77.0365 },
    icon: '🧼',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '101',
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
    id: '102',
    type: 'shelter',
    title: 'Chicago Warming Centers',
    description: 'Network of emergency warming shelters',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '103',
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
    id: '104',
    type: 'food',
    title: 'DC Central Kitchen',
    description: 'Community meals and food distribution',
    coordinate: { latitude: 38.9072, longitude: -77.0369 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '105',
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
    id: '106',
    type: 'wifi',
    title: 'NYC LinkNYC Kiosks',
    description: 'Free gigabit Wi-Fi throughout NYC',
    coordinate: { latitude: 40.7506, longitude: -73.9861 },
    icon: '📶',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '107',
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
    id: '108',
    type: 'charging',
    title: 'Airport Charging Hubs',
    description: 'Universal charging stations at major airports',
    coordinate: { latitude: 33.6367, longitude: -84.4281 }, // Atlanta Airport
    icon: '🔋',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '109',
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
    id: '110',
    type: 'transit',
    title: 'Grand Central Terminal',
    description: 'Major NYC transportation hub',
    coordinate: { latitude: 40.7527, longitude: -73.9772 },
    icon: '🚌',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '111',
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
    id: '112',
    type: 'library',
    title: 'Library of Congress',
    description: 'National library with public access',
    coordinate: { latitude: 38.8886, longitude: -77.0047 },
    icon: '📚',
    accessibility: true,
    rating: 4.9,
  },
  {
    id: '113',
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
    id: '114',
    type: 'clinic',
    title: 'Federally Qualified Health Centers',
    description: 'Community health services nationwide',
    coordinate: { latitude: 40.7282, longitude: -73.9942 }, // NYC
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '115',
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
    id: '116',
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
    id: '117',
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
    id: '118',
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
    id: '119',
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
    id: '120',
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
    id: '121',
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
    id: '122',
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
    id: '123',
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
    id: '124',
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
    id: '125',
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
    id: '126',
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
    id: '127',
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
    id: '128',
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
    id: '129',
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
    id: '130',
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
    id: '131',
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
    id: '132',
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
    id: '133',
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
    id: '134',
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
    id: '135',
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
    id: '136',
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
    id: '137',
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
    id: '138',
    type: 'water',
    title: 'Indianapolis Motor Speedway',
    description: 'Racing venue water stations',
    coordinate: { latitude: 39.7950, longitude: -86.2350 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },

  // ============== CRITICAL STATE EXPANSION - PHASE 1 ==============
  
  // KENTUCKY - Major Coverage Gap (Rank #51 in National Performance)
  {
    id: '139',
    type: 'food',
    title: 'Louisville Dare to Care Food Bank',
    description: 'Kentucky\'s largest food bank serving 13 counties',
    coordinate: { latitude: 38.2467, longitude: -85.7585 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '140',
    type: 'clinic',
    title: 'Louisville Health Center',
    description: 'Community health services in coal region',
    coordinate: { latitude: 38.2544, longitude: -85.7594 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '141',
    type: 'shelter',
    title: 'Lexington Rescue Mission',
    description: 'Emergency shelter and recovery services',
    coordinate: { latitude: 38.0406, longitude: -84.5037 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '142',
    type: 'library',
    title: 'Kentucky State Library',
    description: 'Frankfort main library with statewide services',
    coordinate: { latitude: 38.1970, longitude: -84.8630 },
    icon: '📚',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '143',
    type: 'transit',
    title: 'Louisville Metro Transit',
    description: 'Public bus system serving metro area',
    coordinate: { latitude: 38.2526, longitude: -85.7584 },
    icon: '🚌',
    accessibility: true,
    rating: 4.2,
  },

  // INDIANA - Major Population with Poor Infrastructure Performance (Rank #50)
  {
    id: '144',
    type: 'food',
    title: 'Indianapolis Food Bank Network',
    description: 'Gleaners Food Bank serving central Indiana',
    coordinate: { latitude: 39.7684, longitude: -86.1581 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '145',
    type: 'clinic',
    title: 'Indianapolis Community Health',
    description: 'Federally qualified health center',
    coordinate: { latitude: 39.7767, longitude: -86.1469 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '146',
    type: 'shelter',
    title: 'Fort Wayne Rescue Mission',
    description: 'Comprehensive homeless services',
    coordinate: { latitude: 41.0793, longitude: -85.1394 },
    icon: '🏠',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '147',
    type: 'library',
    title: 'Indianapolis Central Library',
    description: 'Historic downtown library with full services',
    coordinate: { latitude: 39.7717, longitude: -86.1542 },
    icon: '📚',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '148',
    type: 'wifi',
    title: 'Indiana University Health WiFi',
    description: 'Free public WiFi at major medical center',
    coordinate: { latitude: 39.7797, longitude: -86.1746 },
    icon: '📶',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '149',
    type: 'charging',
    title: 'Indianapolis Airport Charging',
    description: 'Extensive charging stations throughout terminal',
    coordinate: { latitude: 39.7173, longitude: -86.2944 },
    icon: '🔌',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '150',
    type: 'restroom',
    title: 'Evansville Riverfront Facilities',
    description: 'Public restrooms at Ohio River waterfront',
    coordinate: { latitude: 37.9716, longitude: -87.5411 },
    icon: '🚻',
    accessibility: true,
    rating: 4.1,
  },

  // WEST VIRGINIA - Rural Health Priority (Rank #49)
  {
    id: '151',
    type: 'clinic',
    title: 'Charleston Health Center',
    description: 'Primary care for underserved coal region',
    coordinate: { latitude: 38.3498, longitude: -81.6326 },
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '152',
    type: 'food',
    title: 'Huntington Food Bank',
    description: 'Emergency food assistance for tri-state area',
    coordinate: { latitude: 38.4192, longitude: -82.4452 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '153',
    type: 'shelter',
    title: 'Morgantown Homeless Shelter',
    description: 'Emergency shelter near university',
    coordinate: { latitude: 39.6295, longitude: -79.9553 },
    icon: '🏠',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '154',
    type: 'library',
    title: 'Charleston Kanawha Library',
    description: 'Main library serving state capital region',
    coordinate: { latitude: 38.3506, longitude: -81.6328 },
    icon: '📚',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '155',
    type: 'water',
    title: 'New River Gorge Water Station',
    description: 'Clean water access for outdoor recreation',
    coordinate: { latitude: 37.9393, longitude: -81.0682 },
    icon: '💧',
    accessibility: true,
    rating: 4.6,
  },

  // OHIO - Major Population, Poor Performance (Rank #48)
  {
    id: '156',
    type: 'food',
    title: 'Cleveland Food Bank',
    description: 'Greater Cleveland Food Bank serves NE Ohio',
    coordinate: { latitude: 41.4993, longitude: -81.6944 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '157',
    type: 'clinic',
    title: 'Cincinnati Community Health',
    description: 'Comprehensive health services',
    coordinate: { latitude: 39.1031, longitude: -84.5120 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '158',
    type: 'shelter',
    title: 'Columbus Rescue Mission',
    description: 'Downtown emergency shelter services',
    coordinate: { latitude: 39.9612, longitude: -82.9988 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '159',
    type: 'library',
    title: 'Cleveland Public Library Main',
    description: 'Historic main library downtown',
    coordinate: { latitude: 41.5045, longitude: -81.6897 },
    icon: '📚',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '160',
    type: 'transit',
    title: 'Toledo Area Transit Authority',
    description: 'Public bus system serving greater Toledo',
    coordinate: { latitude: 41.6528, longitude: -83.5379 },
    icon: '🚌',
    accessibility: true,
    rating: 4.1,
  },
  {
    id: '161',
    type: 'wifi',
    title: 'Akron Public Library WiFi',
    description: 'Free high-speed internet access',
    coordinate: { latitude: 41.0814, longitude: -81.5190 },
    icon: '📶',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '162',
    type: 'charging',
    title: 'Columbus Convention Center',
    description: 'Public charging stations throughout facility',
    coordinate: { latitude: 39.9670, longitude: -82.9931 },
    icon: '🔌',
    accessibility: true,
    rating: 4.2,
  },

  // MISSOURI - Complete Coverage Gap (Rank #47)
  {
    id: '163',
    type: 'food',
    title: 'St. Louis Food Bank',
    description: 'Operation Food Search serves Missouri/Illinois',
    coordinate: { latitude: 38.6270, longitude: -90.1994 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '164',
    type: 'clinic',
    title: 'Kansas City Health Center',
    description: 'Community health for metro area',
    coordinate: { latitude: 39.0997, longitude: -94.5786 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '165',
    type: 'shelter',
    title: 'Springfield Rescue Mission',
    description: 'Emergency services in SW Missouri',
    coordinate: { latitude: 37.2153, longitude: -93.2982 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '166',
    type: 'library',
    title: 'Columbia Public Library',
    description: 'University town library with digital services',
    coordinate: { latitude: 38.9517, longitude: -92.3341 },
    icon: '📚',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '167',
    type: 'transit',
    title: 'Kansas City Streetcar',
    description: 'Free downtown transit system',
    coordinate: { latitude: 39.1012, longitude: -94.5844 },
    icon: '🚌',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '168',
    type: 'wifi',
    title: 'St. Louis Lambert Airport WiFi',
    description: 'Free WiFi throughout airport terminals',
    coordinate: { latitude: 38.7487, longitude: -90.3700 },
    icon: '📶',
    accessibility: true,
    rating: 4.3,
  },

  // ============== MAJOR STATE EXPANSION - PHASE 2 ==============
  
  // TEXAS - Significant Underrepresentation (Rank #29, Population #2)
  {
    id: '169',
    type: 'cooling_center',
    title: 'San Antonio Cooling Centers',
    description: 'Emergency cooling during extreme heat',
    coordinate: { latitude: 29.4241, longitude: -98.4936 },
    icon: '❄️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '170',
    type: 'food',
    title: 'San Antonio Food Bank',
    description: 'Southwest Texas regional food distribution',
    coordinate: { latitude: 29.4252, longitude: -98.4946 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '171',
    type: 'clinic',
    title: 'Fort Worth Community Health',
    description: 'Comprehensive health services',
    coordinate: { latitude: 32.7767, longitude: -97.3308 },
    icon: '🏥',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '172',
    type: 'shelter',
    title: 'El Paso Rescue Mission',
    description: 'Border region emergency services',
    coordinate: { latitude: 31.7619, longitude: -106.4850 },
    icon: '🏠',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '173',
    type: 'water',
    title: 'Corpus Christi Beach Water Stations',
    description: 'Fresh water access at public beaches',
    coordinate: { latitude: 27.8006, longitude: -97.3964 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '174',
    type: 'transit',
    title: 'Dallas DART System',
    description: 'Comprehensive metro rail and bus system',
    coordinate: { latitude: 32.7767, longitude: -96.7970 },
    icon: '🚌',
    accessibility: true,
    rating: 4.2,
  },

  // CALIFORNIA - Rural/Inland Expansion (Rank #8)
  {
    id: '175',
    type: 'cooling_center',
    title: 'Fresno Emergency Cooling',
    description: 'Central Valley heat relief centers',
    coordinate: { latitude: 36.7378, longitude: -119.7871 },
    icon: '❄️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '176',
    type: 'food',
    title: 'Sacramento Food Bank',
    description: 'Regional food assistance for Northern California',
    coordinate: { latitude: 38.5816, longitude: -121.4944 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '177',
    type: 'clinic',
    title: 'San Diego Community Health',
    description: 'Border region comprehensive health services',
    coordinate: { latitude: 32.7157, longitude: -117.1611 },
    icon: '🏥',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '178',
    type: 'water',
    title: 'Bakersfield Drought Relief',
    description: 'Emergency water distribution center',
    coordinate: { latitude: 35.3733, longitude: -119.0187 },
    icon: '💧',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '179',
    type: 'shelter',
    title: 'Stockton Homeless Services',
    description: 'Central Valley emergency shelter',
    coordinate: { latitude: 37.9577, longitude: -121.2908 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },

  // FLORIDA - Hurricane/Emergency Infrastructure (Rank #40)
  {
    id: '180',
    type: 'hurricane_shelter',
    title: 'Tampa Hurricane Shelter',
    description: 'Major emergency shelter for Gulf Coast',
    coordinate: { latitude: 27.9506, longitude: -82.4572 },
    icon: '🌀',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '181',
    type: 'cooling_center',
    title: 'Jacksonville Cooling Centers',
    description: 'Summer heat relief throughout city',
    coordinate: { latitude: 30.3322, longitude: -81.6557 },
    icon: '❄️',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '182',
    type: 'food',
    title: 'Tallahassee Food Network',
    description: 'Capital region food assistance',
    coordinate: { latitude: 30.4518, longitude: -84.2807 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '183',
    type: 'clinic',
    title: 'St. Petersburg Community Health',
    description: 'Gulf Coast health services',
    coordinate: { latitude: 27.7676, longitude: -82.6403 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '184',
    type: 'water',
    title: 'Fort Lauderdale Beach Stations',
    description: 'Beach water fountains and rinse stations',
    coordinate: { latitude: 26.1224, longitude: -80.1373 },
    icon: '💧',
    accessibility: true,
    rating: 4.2,
  },

  // ============== HIGH-PERFORMING STATE EXPANSION - PHASE 3 ==============
  
  // WASHINGTON - Best Performance (Rank #1) - Expand Beyond Seattle
  {
    id: '185',
    type: 'food',
    title: 'Spokane Food Bank',
    description: 'Eastern Washington food assistance',
    coordinate: { latitude: 47.6587, longitude: -117.4260 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '186',
    type: 'shelter',
    title: 'Tacoma Rescue Mission',
    description: 'South Sound emergency services',
    coordinate: { latitude: 47.2529, longitude: -122.4443 },
    icon: '🏠',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '187',
    type: 'clinic',
    title: 'Bellevue NeighborCare Health',
    description: 'Eastside community health center',
    coordinate: { latitude: 47.6101, longitude: -122.2015 },
    icon: '🏥',
    accessibility: true,
    rating: 4.8,
  },
  {
    id: '188',
    type: 'library',
    title: 'Everett Public Library',
    description: 'Regional library serving Snohomish County',
    coordinate: { latitude: 47.9790, longitude: -122.2021 },
    icon: '📚',
    accessibility: true,
    rating: 4.6,
  },

  // OREGON - Excellent Infrastructure (Rank #2) - Expand Beyond Portland  
  {
    id: '189',
    type: 'food',
    title: 'Eugene Food Bank',
    description: 'Lane County food assistance program',
    coordinate: { latitude: 44.0521, longitude: -123.0868 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '190',
    type: 'clinic',
    title: 'Salem Community Health',
    description: 'Capital region health services',
    coordinate: { latitude: 44.9429, longitude: -123.0351 },
    icon: '🏥',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '191',
    type: 'shelter',
    title: 'Bend Homeless Shelter',
    description: 'Central Oregon emergency services',
    coordinate: { latitude: 44.0582, longitude: -121.3153 },
    icon: '🏠',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '192',
    type: 'library',
    title: 'Medford Library',
    description: 'Southern Oregon regional library',
    coordinate: { latitude: 42.3265, longitude: -122.8756 },
    icon: '📚',
    accessibility: true,
    rating: 4.5,
  },

  // ============== RURAL AND SPECIALIZED EXPANSION - PHASE 4 ==============
  
  // Native American Reservation Services
  {
    id: '193',
    type: 'clinic',
    title: 'Navajo Nation Health Center',
    description: 'Tribal health services in Arizona',
    coordinate: { latitude: 36.0544, longitude: -109.0473 },
    icon: '🏥',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '194',
    type: 'food',
    title: 'Cherokee Nation Food Distribution',
    description: 'Tribal food assistance in Oklahoma',
    coordinate: { latitude: 35.9151, longitude: -94.8208 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.5,
  },

  // Agricultural Community Services
  {
    id: '195',
    type: 'water',
    title: 'Iowa Farming Community Well',
    description: 'Clean water access for agricultural workers',
    coordinate: { latitude: 41.5868, longitude: -93.6250 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '196',
    type: 'clinic',
    title: 'Nebraska Rural Health Clinic',
    description: 'Healthcare for farming communities',
    coordinate: { latitude: 41.2565, longitude: -95.9345 },
    icon: '🏥',
    accessibility: true,
    rating: 4.2,
  },

  // Border Region Services
  {
    id: '197',
    type: 'water',
    title: 'Laredo Border Water Station',
    description: 'Hydration station at international crossing',
    coordinate: { latitude: 27.5306, longitude: -99.4803 },
    icon: '💧',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '198',
    type: 'clinic',
    title: 'Brownsville Border Health',
    description: 'Healthcare services at Mexico border',
    coordinate: { latitude: 25.9018, longitude: -97.4975 },
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },

  // Climate-Specific Emergency Services
  {
    id: '199',
    type: 'warming_center',
    title: 'Minneapolis Emergency Warming',
    description: 'Extreme cold weather shelter',
    coordinate: { latitude: 44.9778, longitude: -93.2650 },
    icon: '🔥',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '200',
    type: 'disaster_relief',
    title: 'Oklahoma Tornado Shelter',
    description: 'Emergency shelter for severe weather',
    coordinate: { latitude: 35.4676, longitude: -97.5164 },
    icon: '🌪️',
    accessibility: true,
    rating: 4.7,
  },

  // ============== GOVERNMENT SERVICES - HRSA HEALTH CENTERS ==============
  {
    id: '301',
    type: 'health_center',
    title: 'Community Health Center of Northern California',
    description: 'HRSA-funded comprehensive health services',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    icon: '🏥',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '302',
    type: 'community_health_center',
    title: 'East Harlem Health Center',
    description: 'Community-based primary care and dental services',
    coordinate: { latitude: 40.7969, longitude: -73.9441 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '303',
    type: 'migrant_health_center',
    title: 'Florida Migrant Health Program',
    description: 'Healthcare for seasonal and migrant workers',
    coordinate: { latitude: 27.7663, longitude: -82.6404 },
    icon: '🚑',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '304',
    type: 'homeless_health_center',
    title: 'Seattle Homeless Health Program',
    description: 'Healthcare services for homeless individuals',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
    icon: '🏠',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '305',
    type: 'public_housing_health_center',
    title: 'Chicago Public Housing Health Center',
    description: 'Healthcare services in public housing communities',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🏘️',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '306',
    type: 'school_based_health_center',
    title: 'Roosevelt High School Health Center',
    description: 'On-site healthcare for students and families',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '🏫',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '307',
    type: 'federally_qualified_health_center',
    title: 'Denver FQHC Main Campus',
    description: 'Federally qualified health center with sliding fees',
    coordinate: { latitude: 39.7392, longitude: -104.9903 },
    icon: '🏥',
    accessibility: true,
    rating: 4.8,
  },

  // ============== GOVERNMENT SERVICES - VA FACILITIES ==============
  {
    id: '401',
    type: 'va_facility',
    title: 'VA Greater Los Angeles Healthcare System',
    description: 'Full-service VA medical center',
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    icon: '🇺🇸',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '402',
    type: 'va_medical_center',
    title: 'James A. Haley Veterans Hospital',
    description: 'Major VA medical center with specialty care',
    coordinate: { latitude: 28.0589, longitude: -82.4572 },
    icon: '🏥',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '403',
    type: 'va_outpatient_clinic',
    title: 'Phoenix VA Outpatient Clinic',
    description: 'Primary care and specialty services for veterans',
    coordinate: { latitude: 33.4484, longitude: -112.0740 },
    icon: '🏥',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '404',
    type: 'va_vet_center',
    title: 'Chicago Vet Center',
    description: 'Counseling and readjustment services',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🎖️',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '405',
    type: 'va_regional_office',
    title: 'Atlanta VA Regional Office',
    description: 'Disability compensation and pension services',
    coordinate: { latitude: 33.7490, longitude: -84.3880 },
    icon: '🏢',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '406',
    type: 'va_cemetery',
    title: 'Arlington National Cemetery',
    description: 'National military cemetery',
    coordinate: { latitude: 38.8738, longitude: -77.0680 },
    icon: '⚰️',
    accessibility: true,
    rating: 4.9,
  },

  // ============== GOVERNMENT SERVICES - USDA FACILITIES ==============
  {
    id: '501',
    type: 'usda_facility',
    title: 'USDA Rural Development Office - Kansas',
    description: 'Rural development programs and assistance',
    coordinate: { latitude: 39.0473, longitude: -95.6890 },
    icon: '🌾',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '502',
    type: 'usda_rural_development_office',
    title: 'Montana Rural Development Center',
    description: 'Rural housing and community development',
    coordinate: { latitude: 47.0527, longitude: -109.6333 },
    icon: '🚜',
    accessibility: true,
    rating: 4.4,
  },
  {
    id: '503',
    type: 'usda_snap_office',
    title: 'California SNAP Benefits Office',
    description: 'Food assistance program enrollment',
    coordinate: { latitude: 38.5816, longitude: -121.4944 },
    icon: '🍎',
    accessibility: true,
    rating: 4.2,
  },
  {
    id: '504',
    type: 'usda_farm_service_center',
    title: 'Iowa Farm Service Agency',
    description: 'Farm loans and crop insurance services',
    coordinate: { latitude: 41.5868, longitude: -93.6250 },
    icon: '🚜',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '505',
    type: 'usda_extension_office',
    title: 'Texas A&M Extension Office',
    description: 'Agricultural education and research extension',
    coordinate: { latitude: 30.6280, longitude: -96.3344 },
    icon: '📚',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '506',
    type: 'usda_wic_office',
    title: 'Florida WIC Program Center',
    description: 'Women, Infants, and Children nutrition program',
    coordinate: { latitude: 30.4518, longitude: -84.2807 },
    icon: '🍼',
    accessibility: true,
    rating: 4.4,
  },

  // ============== ADDITIONAL INFRASTRUCTURE (Fix type mismatches) ==============
  {
    id: '601',
    type: 'water_fountain',
    title: 'Boston Common Water Fountain',
    description: 'Historic park drinking fountain',
    coordinate: { latitude: 42.3601, longitude: -71.0589 },
    icon: '💧',
    accessibility: true,
    rating: 4.3,
  },
  {
    id: '602',
    type: 'charging_station',
    title: 'Orlando Airport Charging Hub',
    description: 'Multiple device charging stations',
    coordinate: { latitude: 28.4294, longitude: -81.3089 },
    icon: '🔋',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '603',
    type: 'atm',
    title: 'Bank of America ATM - Downtown',
    description: '24/7 ATM with accessibility features',
    coordinate: { latitude: 40.7505, longitude: -73.9934 },
    icon: '🏧',
    accessibility: true,
    rating: 4.1,
  },
  {
    id: '604',
    type: 'phone_booth',
    title: 'NYC Public Payphone',
    description: 'Emergency communications access',
    coordinate: { latitude: 40.7829, longitude: -73.9654 },
    icon: '📞',
    accessibility: true,
    rating: 3.8,
  },

  // ============== ESSENTIAL SERVICES ==============
  {
    id: '701',
    type: 'emergency_shelter',
    title: 'Red Cross Emergency Shelter - Houston',
    description: 'Disaster relief and emergency housing',
    coordinate: { latitude: 29.7604, longitude: -95.3698 },
    icon: '🏠',
    accessibility: true,
    rating: 4.6,
  },
  {
    id: '702',
    type: 'food_assistance',
    title: 'Feeding America Food Bank',
    description: 'Food distribution and assistance programs',
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
    icon: '🍽️',
    accessibility: true,
    rating: 4.7,
  },
  {
    id: '703',
    type: 'medical_clinic',
    title: 'Planned Parenthood Health Center',
    description: 'Reproductive health and family planning services',
    coordinate: { latitude: 34.0522, longitude: -118.2437 },
    icon: '🏥',
    accessibility: true,
    rating: 4.5,
  },
  {
    id: '704',
    type: 'mental_health_service',
    title: 'Community Mental Health Center',
    description: 'Counseling and mental health support services',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
    icon: '🧠',
    accessibility: true,
    rating: 4.4,
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
  const [comprehensiveUtilities, setComprehensiveUtilities] = useState<any[]>([]);
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
  const [isLoadingUtilities, setIsLoadingUtilities] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Fetch comprehensive utilities when location is available
  useEffect(() => {
    if (currentLocation && isMapReady) {
      fetchComprehensiveUtilities();
    }
  }, [currentLocation, isMapReady]);

  // Automatically show all utilities when map is ready
  useEffect(() => {
    if (isMapReady && (comprehensiveUtilities.length > 0 || utilities.length > 0)) {
      // Small delay to ensure map is fully loaded
      setTimeout(() => {
        showAllUtilities();
      }, 1000);
    }
  }, [isMapReady, comprehensiveUtilities.length, utilities.length]);

  const fetchComprehensiveUtilities = async () => {
    if (!currentLocation) return;
    
    setIsLoadingUtilities(true);
    console.log('🚻 Fetching comprehensive utilities including restrooms...');
    
    try {
      // Import comprehensive restroom API
      const { restroomAPI } = require('./src/services/restroomAPI');
      const { searchUtilities } = require('./src/services/api');
      
      // Get comprehensive data including restrooms
      const response = await searchUtilities({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: parseInt(selectedDistance) * 1000, // Convert km to meters
        types: selectedUtilityType === 'all' ? undefined : [selectedUtilityType],
        limit: 2000, // Increased limit for comprehensive 50-state coverage
      });

      const comprehensiveData = response || [];
      
      // Convert to compatible format for the existing UI
      const convertedUtilities = comprehensiveData.map((utility: any, index: number) => ({
        id: utility.id || `comprehensive_${index}`,
        type: utility.type || utility.category,
        title: utility.name || `${utility.type} #${index + 1}`,
        description: utility.description || `${utility.type} facility`,
        coordinate: {
          latitude: utility.latitude,
          longitude: utility.longitude,
        },
        icon: getUtilityIcon(utility.type || utility.category),
        accessibility: utility.wheelchair_accessible || utility.isAccessible || false,
        rating: utility.rating || 4.0,
        address: utility.address || 'Address not available',
        verified: utility.verified || false,
        is24Hours: utility.is24Hours || false,
      }));

      console.log(`✅ Found ${comprehensiveData.length} comprehensive utilities (including ${comprehensiveData.filter((u: any) => u.type === 'restroom').length} restrooms)`);
      
      // Combine with existing sample utilities for complete coverage
      const allUtilities = [...convertedUtilities, ...sampleUtilities];
      setComprehensiveUtilities(convertedUtilities);
      setUtilities(allUtilities);
      
    } catch (error) {
      console.error('Error fetching comprehensive utilities:', error);
      // Fall back to sample utilities
      setUtilities(sampleUtilities);
    } finally {
      setIsLoadingUtilities(false);
    }
  };

  const getUtilityIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      'restroom': '🚻',
      'water_fountain': '💧',
      'wifi': '📶',
      'charging_station': '🔋',
      'atm': '🏧',
      'phone_booth': '📞',
      'bench': '🪑',
      'handwashing': '🧼',
      'health_center': '🏥',
      'library': '📚',
      'transit': '🚌',
      'food': '🍽️',
      'shelter': '🏠',
      'clinic': '🏥',
    };
    return iconMap[type] || '📍';
  };

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
    // Infrastructure
    { label: 'Public Restroom', value: 'restroom', icon: '🚻' },
    { label: 'Water Fountain', value: 'water_fountain', icon: '💧' },
    { label: 'Wi-Fi Hotspot', value: 'wifi', icon: '📶' },
    { label: 'Phone Charging Station', value: 'charging_station', icon: '🔋' },
    { label: 'ATM', value: 'atm', icon: '🏧' },
    { label: 'Phone Booth', value: 'phone_booth', icon: '📞' },
    { label: 'Public Bench', value: 'bench', icon: '🪑' },
    { label: 'Handwashing Station', value: 'handwashing', icon: '🧼' },
    
    // Health Services (HRSA)
    { label: 'Health Center', value: 'health_center', icon: '🏥' },
    { label: 'Community Health Center', value: 'community_health_center', icon: '🏥' },
    { label: 'Migrant Health Center', value: 'migrant_health_center', icon: '🚑' },
    { label: 'Homeless Health Center', value: 'homeless_health_center', icon: '🏠' },
    { label: 'Public Housing Health Center', value: 'public_housing_health_center', icon: '🏘️' },
    { label: 'School-Based Health Center', value: 'school_based_health_center', icon: '🏫' },
    { label: 'FQHC', value: 'federally_qualified_health_center', icon: '🏥' },
    
    // Veterans Services (VA)
    { label: 'VA Facility', value: 'va_facility', icon: '🇺🇸' },
    { label: 'VA Medical Center', value: 'va_medical_center', icon: '🏥' },
    { label: 'VA Outpatient Clinic', value: 'va_outpatient_clinic', icon: '🏥' },
    { label: 'Vet Center', value: 'va_vet_center', icon: '🎖️' },
    { label: 'VA Regional Office', value: 'va_regional_office', icon: '🏢' },
    { label: 'VA Cemetery', value: 'va_cemetery', icon: '⚰️' },
    
    // USDA Services
    { label: 'USDA Facility', value: 'usda_facility', icon: '🌾' },
    { label: 'Rural Development Office', value: 'usda_rural_development_office', icon: '🚜' },
    { label: 'SNAP Office', value: 'usda_snap_office', icon: '🍎' },
    { label: 'Farm Service Center', value: 'usda_farm_service_center', icon: '🚜' },
    { label: 'Extension Office', value: 'usda_extension_office', icon: '📚' },
    { label: 'WIC Office', value: 'usda_wic_office', icon: '🍼' },
    
    // Essential Services
    { label: 'Emergency Shelter', value: 'emergency_shelter', icon: '🏠' },
    { label: 'Free Food Location', value: 'food_assistance', icon: '🍽️' },
    { label: 'Medical Clinic', value: 'medical_clinic', icon: '🏥' },
    { label: 'Mental Health Service', value: 'mental_health_service', icon: '🧠' },
    { label: 'Transit Stop', value: 'transit', icon: '🚌' },
    { label: 'Public Library', value: 'library', icon: '📚' },
  ];

  const distanceOptions = [
    { label: 'Within 0.5 km', value: '0.5', icon: '📍' },
    { label: 'Within 1 km', value: '1', icon: '📍' },
    { label: 'Within 2 km', value: '2', icon: '📍' },
    { label: 'Within 5 km', value: '5', icon: '📍' },
  ];

  // Enhanced filtering logic to handle both old and new type values
  const getCompatibleTypes = (selectedType: string): string[] => {
    // Map new dropdown values to compatible existing data types
    const typeMap: { [key: string]: string[] } = {
      'water_fountain': ['water_fountain', 'water'], // Handle both new and old
      'charging_station': ['charging_station', 'charging'], // Handle both new and old
      'food_assistance': ['food_assistance', 'food'], // Handle both new and old
      'emergency_shelter': ['emergency_shelter', 'shelter'], // Handle both new and old
      'medical_clinic': ['medical_clinic', 'clinic'], // Handle both new and old
    };
    
    return typeMap[selectedType] || [selectedType];
  };

  const filteredUtilities = utilities.filter(utility => {
    if (selectedUtilityType === 'all') return true;
    
    const compatibleTypes = getCompatibleTypes(selectedUtilityType);
    return compatibleTypes.includes(utility.type);
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
            // Refresh comprehensive utilities with new filter
            if (currentLocation) {
              fetchComprehensiveUtilities();
            }
          }}
          placeholder="Select Utility Type"
          style={styles.filterDropdown}
        />
        
        <CustomDropdown
          options={distanceOptions}
          onSelect={(value) => {
            setSelectedDistance(value);
            console.log('Selected distance:', value);
            // Refresh comprehensive utilities with new distance
            if (currentLocation) {
              fetchComprehensiveUtilities();
            }
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

          {/* Utility Markers - Fixed Icon Flickering */}
          {filteredUtilities.map((utility) => {
                         // Create proper utility object for PerformanceMarker
             const utilityForMarker = {
               id: utility.id,
               name: utility.title,
               type: utility.type as UtilityType, // Cast type
               category: utility.type as UtilityCategory, // Cast type as category
               latitude: utility.coordinate.latitude,
               longitude: utility.coordinate.longitude,
               verified: utility.accessibility || false, // Use accessibility as verified status
               wheelchair_accessible: utility.accessibility,
               rating: utility.rating,
               rating_count: 1,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString(),
             };

            return (
              <Marker
                key={utility.id}
                coordinate={utility.coordinate}
                title={utility.title}
                description={utility.description}
                onPress={() => handleMarkerPress(utility)}
                // Anti-flickering properties
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}
                flat={false}
                rotation={0}
                zIndex={utility.accessibility ? 2 : 1}
              >
                <PerformanceMarker 
                  utility={utilityForMarker} 
                  theme={{
                    colors: {
                      primary: '#007AFF',
                      secondary: '#FF9500',
                      surface: '#FFFFFF',
                      onPrimary: '#FFFFFF',
                      tertiary: '#34C759',
                      onTertiary: '#FFFFFF',
                    }
                  }}
                  onMarkerReady={() => {/* Marker ready */}}
                />
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={centerOnUserLocation}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>My Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction} 
          onPress={() => {
            if (currentLocation) {
              fetchComprehensiveUtilities();
            }
            showAllUtilities();
          }}
        >
          <Text style={styles.actionIcon}>{isLoadingUtilities ? '⏳' : '🗺️'}</Text>
          <Text style={styles.actionLabel}>{isLoadingUtilities ? 'Loading...' : 'Refresh All'}</Text>
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
    // Infrastructure
    { label: 'Public Restroom', value: 'restroom', icon: '🚻' },
    { label: 'Water Fountain', value: 'water_fountain', icon: '💧' },
    { label: 'Wi-Fi Hotspot', value: 'wifi', icon: '📶' },
    { label: 'Phone Charging Station', value: 'charging_station', icon: '🔋' },
    { label: 'ATM', value: 'atm', icon: '🏧' },
    { label: 'Phone Booth', value: 'phone_booth', icon: '📞' },
    { label: 'Public Bench', value: 'bench', icon: '🪑' },
    { label: 'Handwashing Station', value: 'handwashing', icon: '🧼' },
    
    // Health Services (HRSA)
    { label: 'Health Center', value: 'health_center', icon: '🏥' },
    { label: 'Community Health Center', value: 'community_health_center', icon: '🏥' },
    { label: 'Migrant Health Center', value: 'migrant_health_center', icon: '🚑' },
    { label: 'Homeless Health Center', value: 'homeless_health_center', icon: '🏠' },
    { label: 'Public Housing Health Center', value: 'public_housing_health_center', icon: '🏘️' },
    { label: 'School-Based Health Center', value: 'school_based_health_center', icon: '🏫' },
    { label: 'FQHC', value: 'federally_qualified_health_center', icon: '🏥' },
    
    // Veterans Services (VA)
    { label: 'VA Facility', value: 'va_facility', icon: '🇺🇸' },
    { label: 'VA Medical Center', value: 'va_medical_center', icon: '🏥' },
    { label: 'VA Outpatient Clinic', value: 'va_outpatient_clinic', icon: '🏥' },
    { label: 'Vet Center', value: 'va_vet_center', icon: '🎖️' },
    { label: 'VA Regional Office', value: 'va_regional_office', icon: '🏢' },
    { label: 'VA Cemetery', value: 'va_cemetery', icon: '⚰️' },
    
    // USDA Services
    { label: 'USDA Facility', value: 'usda_facility', icon: '🌾' },
    { label: 'Rural Development Office', value: 'usda_rural_development_office', icon: '🚜' },
    { label: 'SNAP Office', value: 'usda_snap_office', icon: '🍎' },
    { label: 'Farm Service Center', value: 'usda_farm_service_center', icon: '🚜' },
    { label: 'Extension Office', value: 'usda_extension_office', icon: '📚' },
    { label: 'WIC Office', value: 'usda_wic_office', icon: '🍼' },
    
    // Essential Services
    { label: 'Emergency Shelter', value: 'emergency_shelter', icon: '🏠' },
    { label: 'Free Food Location', value: 'food_assistance', icon: '🍽️' },
    { label: 'Medical Clinic', value: 'medical_clinic', icon: '🏥' },
    { label: 'Mental Health Service', value: 'mental_health_service', icon: '🧠' },
    { label: 'Transit Stop', value: 'transit', icon: '🚌' },
    { label: 'Public Library', value: 'library', icon: '📚' },
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