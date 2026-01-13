import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAPIClient, User, LoginCredentials, RegisterData, TokenManager, UserDataManager } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase/config';
import { Platform } from 'react-native';

export type UserRole = 'DRIVER' | 'PASSENGER';

// Google User Data interface for authentication
export interface GoogleUserData {
  email: string;
  name: string;
  photoURL: string | null;
  uid: string;
  idToken: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  
  // Enhanced session data
  sessionId: string | null;
  sessionExpiresAt: number | null;
  
  // Core auth methods
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleUserData?: GoogleUserData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Token management
  refreshToken: () => Promise<void>;
  isTokenValid: () => boolean;
  
  // Session management
  validateSession: () => Promise<boolean>;
  isSessionExpired: () => boolean;
  
  // User management
  updateUser: (userData: Partial<User>) => Promise<void>;
  
  // Role-based access
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Enhanced session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  
  const apiClient = getAPIClient();

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      setIsLoading(true);
      
      // Load user data and token
      const [storedUser, token] = await Promise.all([
        UserDataManager.getUserData(),
        TokenManager.getAuthToken(),
      ]);
      
      if (storedUser && token) {
        setUser(storedUser);
        setAuthToken(token);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      // Clear potentially corrupted data
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const credentials: LoginCredentials = {
        email,
        password,
      };
      
      const authResponse = await apiClient.login(credentials);
      
      if (authResponse.success) {
        setUser(authResponse.user);
        setAuthToken(authResponse.token);
        
        // Handle enhanced session data
        if (authResponse.sessionId) {
          setSessionId(authResponse.sessionId);
        }
        if (authResponse.sessionExpiresAt) {
          setSessionExpiresAt(authResponse.sessionExpiresAt);
        }

        // If this is a driver login, save the driver session
        if (authResponse.user.role === 'DRIVER' && authResponse.sessionId) {
          const driverSession = {
            driverId: authResponse.user.driverId || authResponse.user.id,
            mongoId: authResponse.user.mongoId || authResponse.user.id,
            sessionId: authResponse.sessionId,
            busId: authResponse.user.busId || '',
            routeId: authResponse.user.routeId || '',
            isOnline: false,
          };
          await AsyncStorage.setItem('@driver_session', JSON.stringify(driverSession));
        }
      } else {
        throw new Error(authResponse.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const loginWithGoogle = async (externalGoogleUserData?: GoogleUserData) => {
    setIsLoading(true);
    try {
      let googleUserData: GoogleUserData | undefined;
      let idToken: string;
      
      if (externalGoogleUserData) {
        // Mobile flow: Google user data passed from expo-auth-session
        googleUserData = externalGoogleUserData;
        idToken = externalGoogleUserData.idToken;
      } else if (Platform.OS === 'web') {
        // Web: Use Firebase signInWithPopup
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        
        if (!firebaseUser || !firebaseUser.email) {
          throw new Error('Google sign-in failed - no user data');
        }

        // Get Firebase ID token
        idToken = await firebaseUser.getIdToken();
        
        // Extract user information
        googleUserData = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          idToken: idToken,
        };
      } else {
        // Mobile without external data - this shouldn't happen if using the hook properly
        throw new Error('Mobile Google Sign-In requires using the useGoogleAuth hook');
      }

      if (!googleUserData || !googleUserData.email) {
        throw new Error('Failed to get user data from Google');
      }

      idToken = googleUserData.idToken;

      // Try to login with existing account first
      try {
        // Create a special identifier for Google users
        const googlePassword = `google_${googleUserData.uid}_${idToken.substring(0, 20)}`;
        
        const loginResponse = await apiClient.login({
          email: googleUserData.email,
          password: googlePassword,
        });

        if (loginResponse.success) {
          setUser(loginResponse.user);
          setAuthToken(loginResponse.token);
          
          if (loginResponse.sessionId) {
            setSessionId(loginResponse.sessionId);
          }
          if (loginResponse.sessionExpiresAt) {
            setSessionExpiresAt(loginResponse.sessionExpiresAt);
          }
          return;
        }
      } catch (loginError) {
        // User doesn't exist, auto-register as PASSENGER
        console.log('User not found, auto-registering as passenger...');
      }

      // Auto-register user as PASSENGER
      const googlePassword = `google_${googleUserData.uid}_${idToken.substring(0, 20)}`;
      
      const registerData: RegisterData = {
        email: googleUserData.email,
        password: googlePassword,
        name: googleUserData.name,
        phone: '', // Can be added later
        role: 'PASSENGER',
        uiMode: 'MODERN',
      };

      const registerResponse = await apiClient.register(registerData);
      
      if (registerResponse.success) {
        // After successful registration, login
        if (registerResponse.token) {
          setUser(registerResponse.user);
          setAuthToken(registerResponse.token);
          
          if (registerResponse.sessionId) {
            setSessionId(registerResponse.sessionId);
          }
          if (registerResponse.sessionExpiresAt) {
            setSessionExpiresAt(registerResponse.sessionExpiresAt);
          }
        } else {
          // If no token from registration, login again
          const loginResponse = await apiClient.login({
            email: googleUserData.email,
            password: googlePassword,
          });
          
          if (loginResponse.success) {
            setUser(loginResponse.user);
            setAuthToken(loginResponse.token);
            
            if (loginResponse.sessionId) {
              setSessionId(loginResponse.sessionId);
            }
            if (loginResponse.sessionExpiresAt) {
              setSessionExpiresAt(loginResponse.sessionExpiresAt);
            }
          }
        }
      } else {
        throw new Error(registerResponse.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const authResponse = await apiClient.register(userData);
      
      if (authResponse.success) {
        // For registration, we might need to login separately
        // since some endpoints don't return tokens immediately
        if (authResponse.token) {
          setUser(authResponse.user);
          setAuthToken(authResponse.token);
          
          // Handle enhanced session data
          if (authResponse.sessionId) {
            setSessionId(authResponse.sessionId);
          }
          if (authResponse.sessionExpiresAt) {
            setSessionExpiresAt(authResponse.sessionExpiresAt);
          }

          // If this is a driver registration, save the driver session
          if (authResponse.user.role === 'DRIVER' && authResponse.sessionId) {
            const driverSession = {
              driverId: authResponse.user.driverId || authResponse.user.id,
              mongoId: authResponse.user.mongoId || authResponse.user.id,
              sessionId: authResponse.sessionId,
              busId: authResponse.user.busId || '',
              routeId: authResponse.user.routeId || '',
              isOnline: false,
            };
            await AsyncStorage.setItem('@driver_session', JSON.stringify(driverSession));
          }
        } else {
          // Registration successful but need to login
          console.log('Registration successful:', authResponse.message);
          // For now, we'll set the user without a token
          // In a real app, you might want to redirect to login
          setUser(authResponse.user);
          setAuthToken('temp_token_' + authResponse.user.id);
        }
      } else {
        throw new Error(authResponse.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // If we have a session ID, properly logout from backend
      if (sessionId) {
        await apiClient.logoutDriver(sessionId);
      } else {
        await apiClient.logout();
      }
      
      // Clear driver session from storage
      await AsyncStorage.removeItem('@driver_session');
      
      setUser(null);
      setAuthToken(null);
      setSessionId(null);
      setSessionExpiresAt(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setAuthToken(null);
      setSessionId(null);
      setSessionExpiresAt(null);
    }
  };

  const refreshToken = async () => {
    try {
      const tokenResponse = await apiClient.refreshToken();
      if (tokenResponse.success && tokenResponse.token) {
        setAuthToken(tokenResponse.token);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const isTokenValid = (): boolean => {
    if (!authToken) return false;
    
    // Check session expiration first
    if (isSessionExpired()) return false;
    
    // Basic token format validation
    const parts = authToken.split('.');
    return parts.length === 3;
  };

  const validateSession = async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    try {
      const response = await apiClient.validateSession(sessionId);
      return response.success;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const isSessionExpired = (): boolean => {
    if (!sessionExpiresAt) return false;
    return Date.now() > sessionExpiresAt;
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Update user data locally first for immediate UI feedback
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update in storage
      await UserDataManager.updateUserData(userData);
      
      // If this is a profile update that needs backend sync,
      // you might want to call the API here as well
      // await apiClient.updateUser(user.id, userData);
      
    } catch (error) {
      console.error('Update user error:', error);
      // Revert local changes on error
      setUser(user);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Basic permission checks
    switch (permission.toLowerCase()) {
      case 'driver':
        return user.role === 'DRIVER';
      case 'passenger':
        return user.role === 'PASSENGER';
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!authToken,
    authToken,
    sessionId,
    sessionExpiresAt,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshToken,
    isTokenValid,
    validateSession,
    isSessionExpired,
    updateUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};