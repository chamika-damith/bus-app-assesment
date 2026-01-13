import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

// Complete the auth session for mobile
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
// Get these from Google Cloud Console: https://console.cloud.google.com/
export const GOOGLE_CLIENT_CONFIG = {
  // Web client ID (from Firebase or Google Cloud Console)
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // iOS client ID (if you have iOS app)
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Android client ID (if you have Android app)
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  // Expo client ID (for development)
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
};

/**
 * Get the appropriate client ID for the current platform
 */
export const getGoogleClientId = (): string => {
  if (Platform.OS === 'ios') {
    return GOOGLE_CLIENT_CONFIG.iosClientId;
  } else if (Platform.OS === 'android') {
    return GOOGLE_CLIENT_CONFIG.androidClientId;
  } else if (Platform.OS === 'web') {
    return GOOGLE_CLIENT_CONFIG.webClientId;
  }
  // Default to Expo Go
  return GOOGLE_CLIENT_CONFIG.expoClientId;
};

/**
 * Configure Google OAuth for Expo
 */
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: getGoogleClientId(),
    iosClientId: GOOGLE_CLIENT_CONFIG.iosClientId,
    androidClientId: GOOGLE_CLIENT_CONFIG.androidClientId,
    webClientId: GOOGLE_CLIENT_CONFIG.webClientId,
    scopes: ['profile', 'email'],
  });

  return {
    request,
    response,
    promptAsync,
  };
};

/**
 * Get user info from Google access token
 */
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    throw error;
  }
};
