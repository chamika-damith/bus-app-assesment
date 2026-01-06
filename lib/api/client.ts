import {
  APIClient,
  LoginCredentials,
  AuthResponse,
  TokenResponse,
  RegisterData,
  LocationUpdate,
  BusLocation,
  LocationData,
  User,
  CreateUserData,
  UpdateUserData,
  Driver,
  DriverRegistration,
  DriverResponse,
  SessionValidation,
  SessionResponse,
  ActiveSession,
  SessionStats,
  // Schemas for validation
  LoginCredentialsSchema,
  AuthResponseSchema,
  TokenResponseSchema,
  RegisterDataSchema,
  LocationUpdateSchema,
  BusLocationSchema,
  UserSchema,
  CreateUserDataSchema,
  UpdateUserDataSchema,
  DriverSchema,
  DriverRegistrationSchema,
  DriverResponseSchema,
  SessionValidationSchema,
  SessionResponseSchema,
  ActiveSessionSchema,
  SessionStatsSchema,
} from './types';
import { AuthenticatedHTTPClient, HTTPError } from './http-client';
import { TokenManager, UserDataManager, DeviceManager } from './storage';
import { API_CONFIG, API_ENDPOINTS, getEnvironmentConfig } from './config';

// ==================== API CLIENT IMPLEMENTATION ====================

export class BusTrackingAPIClient implements APIClient {
  private httpClient: AuthenticatedHTTPClient;
  private baseURL: string;

  constructor(baseURL?: string) {
    const config = getEnvironmentConfig();
    this.baseURL = baseURL || config.apiUrl;

    this.httpClient = new AuthenticatedHTTPClient({
      baseURL: this.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Platform': 'mobile',
      },
    });
  }

  // ==================== AUTHENTICATION METHODS ====================

  /**
   * Login user with credentials (email-only authentication)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedCredentials = LoginCredentialsSchema.parse(credentials);

      // Email-only authentication for drivers
      if (!validatedCredentials.email || !validatedCredentials.password) {
        throw new Error('Email and password are required');
      }

      // Try driver login using email and password
      try {
        // Get device ID for session management
        const deviceId = await DeviceManager.getDeviceId();
        
        const driverLoginData = {
          email: validatedCredentials.email,
          password: validatedCredentials.password,
          deviceId: deviceId,
        };

        const response = await this.httpClient.post(API_ENDPOINTS.AUTH.LOGIN, driverLoginData);

        if (response.data.success && response.data.data) {
          const driverInfo = response.data.data;

          const authResponse: AuthResponse = {
            success: true,
            user: {
              id: driverInfo.driverId,
              name: driverInfo.name,
              email: driverInfo.email,
              phone: driverInfo.phone,
              role: 'DRIVER',
              driverId: driverInfo.driverId,
              busId: driverInfo.busId,
              routeId: driverInfo.routeId,
              licenseNumber: driverInfo.licenseNumber,
            },
            token: 'driver_session_' + driverInfo.driverId, // Create a session token
            message: response.data.message || 'Login successful',
            // Enhanced session data
            sessionId: driverInfo.sessionId,
            sessionStartTime: driverInfo.sessionStartTime,
            sessionExpiresAt: driverInfo.sessionExpiresAt,
          };

          // Store tokens and user data
          await TokenManager.setTokens(authResponse.token);
          await UserDataManager.setUserData(authResponse.user);

          return authResponse;
        }
      } catch (driverLoginError) {
        console.error('Driver login failed:', driverLoginError);

        // Continue to try regular user login for all errors (including 401)
        // Don't throw here - passenger might have same email
        console.log('Driver login failed, trying passenger login');
      }

      // For regular users (passengers), validate against backend users
      try {
        const passengerLoginData = {
          email: validatedCredentials.email,
          password: validatedCredentials.password,
        };

        const response = await this.httpClient.post(API_ENDPOINTS.USERS.LOGIN, passengerLoginData);

        if (response.data.success && response.data.data) {
          const userData = response.data.data;

          const authResponse: AuthResponse = {
            success: true,
            user: {
              id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              phone: userData.telephone || userData.phone,
              role: 'PASSENGER',
              createdAt: userData.createdAt,
            },
            token: 'user_session_' + (userData._id || userData.id) + '_' + Date.now(),
            message: response.data.message || 'Login successful',
          };

          // Store tokens and user data
          await TokenManager.setTokens(authResponse.token);
          await UserDataManager.setUserData(authResponse.user);

          return authResponse;
        }

        throw new Error('Login failed');
      } catch (error) {
        throw new Error('Invalid email or password');
      }

    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Login failed');
      }
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedUserData = RegisterDataSchema.parse(userData);

      // Add device ID if not provided
      if (!validatedUserData.deviceId) {
        validatedUserData.deviceId = await DeviceManager.getDeviceId();
      }

      // For driver registration, call the driver registration endpoint
      if (validatedUserData.role === 'DRIVER') {
        if (!validatedUserData.email) {
          throw new Error('Email is required for Driver registration');
        }
        if (!validatedUserData.phone) {
          throw new Error('Phone number is required for Driver registration');
        }
        if (!validatedUserData.nic) {
          throw new Error('NIC is required for Driver registration');
        }
        if (!validatedUserData.route) {
          throw new Error('Route is required for Driver registration');
        }
        if (!validatedUserData.vehicleNumber) {
          throw new Error('Vehicle Number is required for Driver registration');
        }

        // Driver registration with all required fields
        const driverRegistrationData = {
          name: validatedUserData.name,
          email: validatedUserData.email,
          password: validatedUserData.password,
          phone: validatedUserData.phone, // Backend expects 'phone' in request body
          licenseNumber: validatedUserData.nic, // NIC is used as license number
          busId: validatedUserData.vehicleNumber, // Vehicle number is used as busId
          routeId: validatedUserData.route, // Route is used as routeId
        };

        try {
          const response = await this.httpClient.post(API_ENDPOINTS.DRIVERS.REGISTER, driverRegistrationData);

          if (response.data.success && response.data.data) {
            const driverData = response.data.data;

            // After successful registration, automatically log in
            return await this.login({
              email: validatedUserData.email,
              password: validatedUserData.password,
            });
          }

          throw new Error('Driver registration failed');
        } catch (error) {
          // If registration fails (e.g., driver already exists), throw error
          if (error instanceof HTTPError) {
            if (error.status === 409) {
              throw new Error('A driver with this email or NIC already exists');
            } else if (error.status === 400) {
              throw new Error('Invalid driver registration data');
            }
          }
          throw error;
        }
      } else {
        // For regular user registration (PASSENGER)
        // The backend User model expects: name, email, password, telephone, nic
        if (!validatedUserData.phone) {
          throw new Error('Phone number is required for Passenger registration');
        }
        if (!validatedUserData.nic) {
          throw new Error('NIC is required for Passenger registration');
        }

        const backendUserData = {
          name: validatedUserData.name,
          email: validatedUserData.email || `${validatedUserData.phone}@temp.com`, // Backend requires email
          password: validatedUserData.password,
          telephone: validatedUserData.phone, // Backend expects 'telephone' not 'phone'
          nic: validatedUserData.nic,
        };

        const response = await this.httpClient.post(API_ENDPOINTS.USERS.CREATE, backendUserData);

        // The backend returns { success: true, data: user }
        if (response.data.success && response.data.data) {
          const backendUser = response.data.data;

          // Convert backend user format to our User format
          const user: User = {
            id: backendUser._id || backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            phone: backendUser.telephone,
            role: validatedUserData.role, // Use the role from registration form
            createdAt: backendUser.createdAt,
          };

          const authResponse: AuthResponse = {
            success: true,
            user,
            token: '', // User creation doesn't return token, need to login
            message: 'User registered successfully',
          };

          return authResponse;
        }

        throw new Error('User registration failed');
      }
    } catch (error) {
      if (error instanceof HTTPError) {
        // Extract more detailed error information
        const errorMessage = error.data?.error || error.data?.message || 'Registration failed';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<TokenResponse> {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.httpClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken,
      });

      const tokenResponse = TokenResponseSchema.parse(response.data);

      if (tokenResponse.success && tokenResponse.token) {
        await TokenManager.setTokens(
          tokenResponse.token,
          tokenResponse.refreshToken
        );
      }

      return tokenResponse;
    } catch (error) {
      await TokenManager.clearTokens();
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Token refresh failed');
      }
      throw error;
    }
  }

  /**
   * Update driver online/offline status
   */
  async updateDriverStatus(driverId: string, sessionId: string, isOnline: boolean, mongoId?: string): Promise<void> {
    try {
      await this.httpClient.post(API_ENDPOINTS.AUTH.UPDATE_STATUS, {
        driverId,
        sessionId,
        isOnline,
        mongoId,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to update driver status');
      }
      throw error;
    }
  }

  /**
   * Get driver online/offline status
   */
  async getDriverStatus(driverId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.AUTH.GET_STATUS(driverId));
      return response.data;
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get driver status');
      }
      throw error;
    }
  }

  /**
   * Get detailed driver information
   */
  async getDriverDetails(driverId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.DRIVERS.GET_DETAILS(driverId));
      return response.data;
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get driver details');
      }
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT METHODS ====================

  /**
   * Validate driver session
   */
  async validateSession(sessionId: string): Promise<SessionResponse> {
    try {
      const response = await this.httpClient.post(API_ENDPOINTS.AUTH.VALIDATE_SESSION, {
        sessionId,
      });

      return SessionResponseSchema.parse(response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Session validation failed');
      }
      throw error;
    }
  }

  /**
   * Logout driver (end session)
   */
  async logoutDriver(sessionId: string): Promise<void> {
    try {
      await this.httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        sessionId,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Logout failed');
      }
      throw error;
    }
  }

  /**
   * Get active sessions (admin only)
   */
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.SESSIONS.GET_ACTIVE);

      const sessions = response.data.data || response.data;
      return sessions.map((session: any) => ActiveSessionSchema.parse(session));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get active sessions');
      }
      throw error;
    }
  }

  /**
   * Get session statistics (admin only)
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.SESSIONS.GET_STATS);
      return SessionStatsSchema.parse(response.data.data || response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get session statistics');
      }
      throw error;
    }
  }

  /**
   * Force end session (admin only)
   */
  async forceEndSession(sessionId: string): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.SESSIONS.FORCE_END(sessionId));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to end session');
      }
      throw error;
    }
  }

  // ==================== GPS AND LOCATION METHODS ====================

  /**
   * Update driver location
   */
  async updateDriverLocation(locationData: LocationUpdate): Promise<void> {
    try {
      // Validate input
      const validatedLocationData = LocationUpdateSchema.parse(locationData);

      await this.httpClient.post(API_ENDPOINTS.GPS.UPDATE_LOCATION, validatedLocationData);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to update location');
      }
      throw error;
    }
  }

  /**
   * Get live bus locations
   */
  async getLiveBuses(): Promise<BusLocation[]> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.GPS.GET_LIVE_BUSES);

      // Handle backend response format
      const drivers = response.data.data || response.data;

      const busLocations: BusLocation[] = drivers.map((driver: any) => ({
        busId: driver.busId,
        routeId: driver.routeId,
        driverId: driver.id || driver.driverId,
        location: {
          latitude: driver.location?.latitude || 0,
          longitude: driver.location?.longitude || 0,
          heading: driver.location?.heading || 0,
          speed: driver.location?.speed || 0,
          accuracy: driver.location?.accuracy || 0,
          timestamp: driver.lastSeen || Date.now(),
        },
        isActive: driver.isActive,
        lastUpdate: new Date(driver.lastSeen).toISOString(),
      }));

      return busLocations;
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get live buses');
      }
      throw error;
    }
  }

  /**
   * Get specific bus location
   */
  async getBusLocation(busId: string): Promise<BusLocation> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.GPS.GET_BUS_LOCATION(busId));
      return BusLocationSchema.parse(response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get bus location');
      }
      throw error;
    }
  }

  /**
   * Get bus location history
   */
  async getBusHistory(busId: string): Promise<LocationData[]> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.GPS.GET_BUS_HISTORY(busId));
      return response.data.map((location: any) => ({
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading || 0,
        speed: location.speed || 0,
        accuracy: location.accuracy || 0,
        timestamp: location.timestamp || Date.now(),
      }));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get bus history');
      }
      throw error;
    }
  }

  // ==================== USER MANAGEMENT METHODS ====================

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.USERS.GET_ALL);

      // Handle backend response format: {success: true, data: [...]}
      const users = response.data.data || response.data;

      return users.map((user: any) => ({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.telephone,
        role: user.role || 'PASSENGER',
        createdAt: user.createdAt,
      }));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get users');
      }
      throw error;
    }
  }

  /**
   * Create new user (admin only)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const validatedUserData = CreateUserDataSchema.parse(userData);
      const response = await this.httpClient.post(API_ENDPOINTS.USERS.CREATE, validatedUserData);
      return UserSchema.parse(response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to create user');
      }
      throw error;
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      const validatedUserData = UpdateUserDataSchema.parse(userData);
      const response = await this.httpClient.put(API_ENDPOINTS.USERS.UPDATE(userId), validatedUserData);
      return UserSchema.parse(response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to update user');
      }
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to delete user');
      }
      throw error;
    }
  }

  // ==================== DRIVER MANAGEMENT METHODS ====================

  /**
   * Get all drivers (admin only)
   */
  async getDrivers(): Promise<Driver[]> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.DRIVERS.GET_ALL);

      // Handle backend response format
      const drivers = response.data.data || response.data;

      return drivers.map((driver: any) => ({
        id: driver.id || driver.driverId,
        driverId: driver.driverId || driver.id,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        busId: driver.busId,
        routeId: driver.routeId,
        route: driver.route || driver.routeId,
        vehicleNumber: driver.vehicleNumber || driver.busId,
        isActive: driver.isActive,
        isOnline: driver.isOnline, // Include isOnline from MongoDB
        lastSeen: driver.lastSeen,
        location: driver.location,
      }));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get drivers');
      }
      throw error;
    }
  }

  /**
   * Register new driver
   */
  async registerDriver(driverData: DriverRegistration): Promise<DriverResponse> {
    try {
      const validatedDriverData = DriverRegistrationSchema.parse(driverData);
      const response = await this.httpClient.post(API_ENDPOINTS.DRIVERS.REGISTER, validatedDriverData);
      return DriverResponseSchema.parse(response.data);
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to register driver');
      }
      throw error;
    }
  }

  /**
   * Remove driver (admin only)
   */
  async removeDriver(driverId: string): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.DRIVERS.REMOVE(driverId));
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to remove driver');
      }
      throw error;
    }
  }

  /**
   * Get driver statistics (admin only)
   */
  async getDriverStats(): Promise<any> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.DRIVERS.GET_STATS);
      return response.data;
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get driver stats');
      }
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await TokenManager.hasAuthToken();
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    return await UserDataManager.getUserData();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await TokenManager.clearTokens();
    await UserDataManager.removeUserData();
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await this.httpClient.get(API_ENDPOINTS.SYSTEM.HEALTH);
      return response.data;
    } catch (error) {
      if (error instanceof HTTPError) {
        throw new Error(error.data?.message || 'Failed to get health status');
      }
      throw error;
    }
  }
}

// ==================== SINGLETON INSTANCE ====================

let apiClientInstance: BusTrackingAPIClient | null = null;

/**
 * Get API client singleton instance
 */
export function getAPIClient(): BusTrackingAPIClient {
  if (!apiClientInstance) {
    apiClientInstance = new BusTrackingAPIClient();
  }
  return apiClientInstance;
}

/**
 * Initialize API client with custom base URL
 */
export function initializeAPIClient(baseURL?: string): BusTrackingAPIClient {
  apiClientInstance = new BusTrackingAPIClient(baseURL);
  return apiClientInstance;
}

// ==================== EXPORTS ====================

export * from './types';
export * from './storage';
export * from './http-client';