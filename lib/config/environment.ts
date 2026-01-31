import { Platform } from 'react-native';

// Environment configuration for production builds
export const ENV_CONFIG = {
  // API Configuration
  API_URL: __DEV__ 
    ? 'https://bustracking-backend-ehnq.onrender.com/api' 
    : 'https://bustracking-backend-ehnq.onrender.com/api',
  
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'AIzaSyDXLG6TnuK9HeawdmSVXA56KTKdVul3jLE',
  
  // Firebase Configuration
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyBiUPcQoOzKUXtRCJRwtdYprsxcjIf_0R8",
    authDomain: "translink-dbf1d.firebaseapp.com",
    projectId: "translink-dbf1d",
    storageBucket: "translink-dbf1d.firebasestorage.app",
    messagingSenderId: "937911629962",
    appId: "1:937911629962:web:b6f7c7868d966c6321d573",
    measurementId: "G-62DG6BRS2F"
  },
  
  // App Configuration
  APP_VERSION: '1.0.0',
  APP_NAME: 'TransLink',
  
  // Feature Flags
  FEATURES: {
    GOOGLE_AUTH: true,
    BACKGROUND_LOCATION: true,
    WEBSOCKET: true,
    OFFLINE_MODE: true,
  },
  
  // Debug Configuration
  DEBUG: {
    ENABLE_LOGGING: __DEV__,
    ENABLE_NETWORK_LOGGING: __DEV__,
    ENABLE_REDUX_LOGGING: __DEV__,
  },
  
  // Platform specific settings
  PLATFORM: {
    IS_IOS: Platform.OS === 'ios',
    IS_ANDROID: Platform.OS === 'android',
    IS_WEB: Platform.OS === 'web',
  },
};

// Helper functions
export const getApiUrl = () => ENV_CONFIG.API_URL;
export const getGoogleMapsApiKey = () => ENV_CONFIG.GOOGLE_MAPS_API_KEY;
export const isDebugMode = () => ENV_CONFIG.DEBUG.ENABLE_LOGGING;
export const getAppVersion = () => ENV_CONFIG.APP_VERSION;

// Validation function to check if all required config is present
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV_CONFIG.API_URL) {
    errors.push('API_URL is not configured');
  }
  
  if (!ENV_CONFIG.GOOGLE_MAPS_API_KEY) {
    errors.push('GOOGLE_MAPS_API_KEY is not configured');
  }
  
  if (!ENV_CONFIG.FIREBASE_CONFIG.apiKey) {
    errors.push('Firebase API key is not configured');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }
  
  return true;
};