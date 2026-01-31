import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Step 1: Basic delay to ensure React Native is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Test AsyncStorage access
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage');
          // Test both default and named export
          const storage = AsyncStorage.default || AsyncStorage;
          await storage.getItem('test-key');
          console.log('✅ AsyncStorage accessible');
        } catch (asyncError) {
          console.warn('⚠️ AsyncStorage issue:', asyncError);
        }
        
        // Step 3: Mark as initialized without complex dependencies
        if (isMounted) {
          setIsInitialized(true);
          console.log('✅ App initialization complete');
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
        if (isMounted) {
          setInitializationError(error instanceof Error ? error.message : 'Unknown initialization error');
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        console.log('Navigating to get started screen...');
        router.replace('/auth/simple');
      } catch (error) {
        console.error('❌ Navigation error:', error);
        // Try alternative navigation
        try {
          router.push('/auth/simple');
        } catch (pushError) {
          console.error('❌ Push navigation also failed:', pushError);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🚌</Text>
            <Text style={styles.appName}>TransLink</Text>
          </View>
          
          <Text style={styles.errorText}>
            Initialization Error
          </Text>
          <Text style={styles.errorDetails}>
            {initializationError}
          </Text>
          
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🚌</Text>
          <Text style={styles.appName}>TransLink</Text>
        </View>
        
        <ActivityIndicator 
          size="large" 
          color={Colors.white} 
          style={styles.loader}
        />
        
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing...' : 'Loading...'}
        </Text>
        
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 2,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  version: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
});