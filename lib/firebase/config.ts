import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { Platform } from 'react-native';
import { ENV_CONFIG } from '../config/environment';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(ENV_CONFIG.FIREBASE_CONFIG) : getApp();

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  // Import AsyncStorage dynamically to avoid issues
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  // Check if auth is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    try {
      auth = getAuth(app);
    } catch (error) {
      // If getAuth fails, initialize with persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
  } else {
    // Initialize auth with AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  console.warn('Firebase Auth persistence setup failed, using default:', error);
  // Fallback to default auth without persistence
  auth = getAuth(app);
}

const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth, googleProvider, signInWithPopup, signInWithCredential };
