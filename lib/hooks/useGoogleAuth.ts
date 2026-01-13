import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { getGoogleAuthIds } from '../config/googleAuth';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

// Read Google OAuth Client IDs from app.json (expo.extra.googleAuth)
const ids = getGoogleAuthIds();
const GOOGLE_CLIENT_IDS = {
  webClientId: ids.webClientId || '135721186146-h6gtdbff572112jipu5ejf4aevst7gob.apps.googleusercontent.com',
  androidClientId: ids.androidClientId,
  iosClientId: ids.iosClientId,
  clientId: ids.expoClientId || ids.webClientId || '135721186146-h6gtdbff572112jipu5ejf4aevst7gob.apps.googleusercontent.com',
};

export interface GoogleUserData {
  email: string;
  name: string;
  photoURL: string | null;
  uid: string;
  idToken: string;
}

export interface UseGoogleAuthReturn {
  signIn: () => Promise<GoogleUserData | null>;
  isLoading: boolean;
  error: string | null;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configure the redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'translink',
    path: 'auth',
  });

  // Configure Google Auth Request with platform-specific IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_IDS.clientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId || GOOGLE_CLIENT_IDS.clientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  const signIn = async (): Promise<GoogleUserData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        const { authentication } = result;
        
        if (!authentication?.accessToken) {
          throw new Error('No access token received from Google');
        }

        // Fetch user info using the access token
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }

        const userInfo = await userInfoResponse.json();

        const userData: GoogleUserData = {
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          photoURL: userInfo.picture || null,
          uid: userInfo.id,
          idToken: authentication.idToken || authentication.accessToken,
        };

        setIsLoading(false);
        return userData;
      } else if (result.type === 'cancel') {
        setError('Sign-in was cancelled');
        setIsLoading(false);
        return null;
      } else {
        setError('Sign-in failed');
        setIsLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'An error occurred during sign-in');
      setIsLoading(false);
      return null;
    }
  };

  return {
    signIn,
    isLoading,
    error,
  };
}

export default useGoogleAuth;
