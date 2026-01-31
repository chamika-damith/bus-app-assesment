import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { getGoogleAuthIds } from '../../lib/config/googleAuth';
import { makeRedirectUri } from 'expo-auth-session';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs
// Configure in app.json under expo.extra.googleAuth
const ids = getGoogleAuthIds();
// Fallback to the known web client if present in code
const GOOGLE_WEB_CLIENT_ID = ids.webClientId || '135721186146-h6gtdbff572112jipu5ejf4aevst7gob.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = ids.androidClientId;
const IOS_CLIENT_ID = ids.iosClientId;
const EXPO_CLIENT_ID = ids.expoClientId || GOOGLE_WEB_CLIENT_ID;

const carouselSlides = [
  {
    slide: 1,
    title: "Track buses in real-time",
    icon: "🚌",
    description: "See exactly where your bus is and when it will arrive"
  },
  {
    slide: 2,
    title: "Find routes to your destination",
    icon: "🗺️",
    description: "Get the best routes and connections to reach anywhere"
  },
  {
    slide: 3,
    title: "Get arrival predictions offline",
    icon: "📱",
    description: "Access bus times even when you're not connected"
  }
];

const languages = ['English', 'Sinhala', 'Tamil'];

export default function AuthWelcome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Removed email/phone input state
  const { width } = useWindowDimensions();
  const { login, loginWithGoogle } = useAuth();
  
  // Determine if we should use mobile layout
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Configure Google Auth for mobile using expo-auth-session
  const redirectUri = makeRedirectUri({
    scheme: 'translink',
    path: 'auth',
  });

  // Provide platform-specific client IDs to avoid runtime errors on Android/iOS
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Generic clientId for Expo Go or fallback
    clientId: EXPO_CLIENT_ID,
    // Ensure android/ios keys are present to satisfy platform requirements
    androidClientId: ANDROID_CLIENT_ID || EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  // Handle Google auth response
  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuthSuccess(response.authentication);
    } else if (response?.type === 'cancel') {
      setIsGoogleLoading(false);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Sign In Failed', 'An error occurred during sign-in. Please try again.');
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (authentication: any) => {
    try {
      if (!authentication?.accessToken) {
        throw new Error('No access token received');
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

      // Create google user data object
      const googleUserData = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        photoURL: userInfo.picture || null,
        uid: userInfo.id,
        idToken: authentication.idToken || authentication.accessToken,
      };

      // Call loginWithGoogle with the user data
      await loginWithGoogle(googleUserData);
      
      // On success, navigate to passenger home by default
      router.replace('/passenger');
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Sign In Failed', error.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      if (Platform.OS === 'web') {
        // Web: Use Firebase directly through AuthContext
        await loginWithGoogle();
        router.replace('/passenger');
      } else {
        // Mobile: Use expo-auth-session
        await promptAsync();
        // Response will be handled by the useEffect above
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      let errorMessage = 'Unable to sign in with Google. Please try again.';
      
      if (error.message === 'Sign-in cancelled') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.message.includes('popup')) {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert(
        'Sign In Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsGoogleLoading(false);
    }
  };
  
  // Removed handleContinue for email/phone input

  const handleGetStarted = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            isMobile && styles.scrollContainerMobile
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Left Panel - Branding */}
          <View style={[
            styles.leftPanel,
            isMobile && styles.leftPanelMobile,
            isTablet && styles.leftPanelTablet
          ]}>
            <View style={styles.brandingContainer}>
              <Text style={[
                styles.appName,
                isMobile && styles.appNameMobile
              ]}>TransLink.lk</Text>
              <Text style={[
                styles.tagline,
                isMobile && styles.taglineMobile
              ]}>Real-time public transport tracking</Text>
            </View>
            
            {!isMobile && (
              <TouchableOpacity 
                style={styles.getStartedButton} 
                onPress={handleGetStarted}
              >
                <Text style={styles.getStartedText}>Get started</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right Panel - Login/Welcome */}
          <View style={[
            styles.rightPanel,
            isMobile && styles.rightPanelMobile,
            isTablet && styles.rightPanelTablet
          ]}>
            <View style={[
              styles.rightContent,
              isMobile && styles.rightContentMobile
            ]}>

              

              <TouchableOpacity 
                style={[
                  styles.googleButton,
                  isGoogleLoading && styles.googleButtonDisabled
                ]} 
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <View style={styles.googleButtonContent}>
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.googleButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <View style={styles.googleButtonContent}>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.signUpLink}
                onPress={() => router.push('/auth/register')}
              >
                <Text style={styles.signUpText}>Don't have an account? Sign Up</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing you agree to our Terms & Privacy
              </Text>
              
              {isMobile && (
                <TouchableOpacity 
                  style={[styles.getStartedButton, styles.getStartedButtonMobile]} 
                  onPress={handleGetStarted}
                >
                  <Text style={styles.getStartedText}>Get started</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    minHeight: '100%',
  },
  scrollContainerMobile: {
    flexDirection: 'column',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'space-between',
    padding: 40,
    minHeight: 300,
  },
  leftPanelMobile: {
    flex: 0,
    minHeight: 200,
    padding: 24,
    justifyContent: 'center',
  },
  leftPanelTablet: {
    padding: 32,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  appNameMobile: {
    fontSize: 32,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 24,
  },
  taglineMobile: {
    fontSize: 14,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  getStartedButtonMobile: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  rightPanelMobile: {
    flex: 1,
  },
  rightPanelTablet: {
    flex: 1.2,
  },
  rightContent: {
    padding: 40,
    justifyContent: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  rightContentMobile: {
    padding: 24,
    paddingTop: 32,
  },
  // Removed welcome header, input, continue button, and divider styles
  googleButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
    minHeight: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
    backgroundColor: Colors.light,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  signUpLink: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  signUpText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  termsText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});