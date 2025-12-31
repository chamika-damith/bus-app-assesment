import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAPIClient, User, LoginCredentials, RegisterData, TokenManager, UserDataManager } from '../lib/api';

export type UserRole = 'DRIVER' | 'PASSENGER' | 'ADMIN';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  
  // Core auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Token management
  refreshToken: () => Promise<void>;
  isTokenValid: () => boolean;
  
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
      await apiClient.logout();
      setUser(null);
      setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setAuthToken(null);
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
    
    // Basic token format validation
    const parts = authToken.split('.');
    return parts.length === 3;
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
    
    // Basic role-based permissions
    switch (permission) {
      case 'admin':
        return user.role === 'ADMIN';
      case 'driver':
        return user.role === 'DRIVER' || user.role === 'ADMIN';
      case 'passenger':
        return user.role === 'PASSENGER' || user.role === 'ADMIN';
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!authToken,
    authToken,
    login,
    register,
    logout,
    refreshToken,
    isTokenValid,
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