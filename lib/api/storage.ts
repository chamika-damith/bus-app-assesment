import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== SECURE STORAGE KEYS ====================

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  DEVICE_ID: 'device_id',
} as const;

// ==================== SECURE STORAGE SERVICE ====================

export class SecureStorageService {
  /**
   * Store sensitive data securely using Expo SecureStore
   */
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing secure item ${key}:`, error);
      throw new Error(`Failed to store secure data: ${key}`);
    }
  }

  /**
   * Retrieve sensitive data from Expo SecureStore
   */
  static async getSecureItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data from Expo SecureStore
   */
  static async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
      // Don't throw error for removal failures
    }
  }

  /**
   * Store non-sensitive data using AsyncStorage
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error storing item ${key}:`, error);
      throw new Error(`Failed to store data: ${key}`);
    }
  }

  /**
   * Retrieve non-sensitive data from AsyncStorage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove non-sensitive data from AsyncStorage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      // Don't throw error for removal failures
    }
  }

  /**
   * Clear all stored data (both secure and non-secure)
   */
  static async clearAll(): Promise<void> {
    try {
      // Clear secure storage
      await Promise.all([
        this.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN),
        this.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
        this.removeSecureItem(STORAGE_KEYS.DEVICE_ID),
      ]);

      // Clear AsyncStorage
      await this.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

// ==================== TOKEN MANAGEMENT ====================

export class TokenManager {
  /**
   * Store authentication token securely
   */
  static async setAuthToken(token: string): Promise<void> {
    await SecureStorageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Retrieve authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    return await SecureStorageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Remove authentication token
   */
  static async removeAuthToken(): Promise<void> {
    await SecureStorageService.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Store refresh token securely
   */
  static async setRefreshToken(token: string): Promise<void> {
    await SecureStorageService.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Retrieve refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return await SecureStorageService.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Remove refresh token
   */
  static async removeRefreshToken(): Promise<void> {
    await SecureStorageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store both auth and refresh tokens
   */
  static async setTokens(authToken: string, refreshToken?: string): Promise<void> {
    await this.setAuthToken(authToken);
    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
  }

  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<void> {
    await Promise.all([
      this.removeAuthToken(),
      this.removeRefreshToken(),
    ]);
  }

  /**
   * Check if auth token exists
   */
  static async hasAuthToken(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Validate token format (basic JWT structure check)
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token) return false;
    
    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Check if token is expired (basic check without decoding)
   * This is a simple check - in production you might want to decode the JWT
   */
  static async isTokenExpired(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return true;

    try {
      // For now, we'll rely on the backend to validate token expiration
      // In a production app, you might want to decode the JWT and check exp claim
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
}

// ==================== USER DATA MANAGEMENT ====================

export class UserDataManager {
  /**
   * Store user data (non-sensitive information)
   */
  static async setUserData(userData: any): Promise<void> {
    const userDataString = JSON.stringify(userData);
    await SecureStorageService.setItem(STORAGE_KEYS.USER_DATA, userDataString);
  }

  /**
   * Retrieve user data
   */
  static async getUserData(): Promise<any | null> {
    try {
      const userDataString = await SecureStorageService.getItem(STORAGE_KEYS.USER_DATA);
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Remove user data
   */
  static async removeUserData(): Promise<void> {
    await SecureStorageService.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Update specific user data fields
   */
  static async updateUserData(updates: any): Promise<void> {
    const currentData = await this.getUserData();
    const updatedData = { ...currentData, ...updates };
    await this.setUserData(updatedData);
  }
}

// ==================== DEVICE ID MANAGEMENT ====================

export class DeviceManager {
  /**
   * Generate a unique device ID
   */
  static generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create device ID
   */
  static async getDeviceId(): Promise<string> {
    let deviceId = await SecureStorageService.getSecureItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      await SecureStorageService.setSecureItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Reset device ID (generate new one)
   */
  static async resetDeviceId(): Promise<string> {
    const newDeviceId = this.generateDeviceId();
    await SecureStorageService.setSecureItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);
    return newDeviceId;
  }
}

// ==================== EXPORTS ====================

export { STORAGE_KEYS };