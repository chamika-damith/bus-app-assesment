import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase configuration for TransLink
const firebaseConfig = {
  apiKey: "AIzaSyBiUPcQoOzKUXtRCJRwtdYprsxcjIf_0R8",
  authDomain: "translink-dbf1d.firebaseapp.com",
  projectId: "translink-dbf1d",
  storageBucket: "translink-dbf1d.firebasestorage.app",
  messagingSenderId: "937911629962",
  appId: "1:937911629962:web:b6f7c7868d966c6321d573",
  measurementId: "G-62DG6BRS2F"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth, googleProvider, signInWithPopup, signInWithCredential };
