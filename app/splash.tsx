import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          // Redirect based on user role
          switch (user.role) {
            case 'DRIVER':
              router.replace('/driver');
              break;
            case 'PASSENGER':
              router.replace('/passenger');
              break;
            default:
              router.replace('/auth');
          }
        } else {
          router.replace('/auth');
        }
      }
    }, 3000); // 3 seconds as specified

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🚌</Text>
          <Text style={styles.appName}>TransLink</Text>
        </View>
        
        <ActivityIndicator 
          size="large" 
          color={Colors.primary} 
          style={styles.loader}
        />
        
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
    marginBottom: 40,
  },
  version: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
});