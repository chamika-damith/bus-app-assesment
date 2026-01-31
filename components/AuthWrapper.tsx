import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to initialize AuthContext safely
        const { AuthProvider } = require('../context/AuthContext');
        setIsAuthReady(true);
      } catch (error) {
        console.error('AuthContext initialization failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Auth initialization failed');
        // Continue without auth context - app will work in limited mode
        setIsAuthReady(true);
      }
    };

    initializeAuth();
  }, []);

  if (!isAuthReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Initializing Authentication...</Text>
      </View>
    );
  }

  if (authError) {
    console.warn('Running in limited mode due to auth error:', authError);
    // Return children without AuthProvider - app will work in limited mode
    return <>{children}</>;
  }

  // Try to wrap with AuthProvider
  try {
    const { AuthProvider } = require('../context/AuthContext');
    return <AuthProvider>{children}</AuthProvider>;
  } catch (error) {
    console.warn('AuthProvider failed, running without auth:', error);
    return <>{children}</>;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
});