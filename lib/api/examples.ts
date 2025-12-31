/**
 * API Client Usage Examples
 * 
 * This file demonstrates how to use the BusTrackingAPIClient
 * in various scenarios throughout the application.
 */

import { getAPIClient, LoginCredentials, RegisterData, LocationUpdate } from './index';

// ==================== AUTHENTICATION EXAMPLES ====================

/**
 * Example: User Login
 */
export async function loginExample() {
  const apiClient = getAPIClient();
  
  try {
    const credentials: LoginCredentials = {
      email: 'driver@example.com',
      password: 'securepassword123',
    };
    
    const authResponse = await apiClient.login(credentials);
    
    if (authResponse.success) {
      console.log('Login successful:', authResponse.user);
      // User data and tokens are automatically stored securely
      return authResponse.user;
    } else {
      throw new Error(authResponse.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Example: User Registration
 */
export async function registerExample() {
  const apiClient = getAPIClient();
  
  try {
    const userData: RegisterData = {
      email: 'newuser@example.com',
      password: 'securepassword123',
      name: 'New User',
      role: 'PASSENGER',
      phone: '+1234567890',
    };
    
    const authResponse = await apiClient.register(userData);
    
    if (authResponse.success) {
      console.log('Registration successful:', authResponse.user);
      return authResponse.user;
    } else {
      throw new Error(authResponse.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Example: Check Authentication Status
 */
export async function checkAuthExample() {
  const apiClient = getAPIClient();
  
  try {
    const isAuthenticated = await apiClient.isAuthenticated();
    const currentUser = await apiClient.getCurrentUser();
    
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current user:', currentUser);
    
    return { isAuthenticated, currentUser };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, currentUser: null };
  }
}

// ==================== GPS AND LOCATION EXAMPLES ====================

/**
 * Example: Update Driver Location
 */
export async function updateLocationExample() {
  const apiClient = getAPIClient();
  
  try {
    const locationData: LocationUpdate = {
      driverId: 'driver-123',
      busId: 'bus-456',
      routeId: 'route-789',
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 90,
      speed: 25,
      accuracy: 5,
      status: 'active',
    };
    
    await apiClient.updateDriverLocation(locationData);
    console.log('Location updated successfully');
  } catch (error) {
    console.error('Location update error:', error);
    throw error;
  }
}

/**
 * Example: Get Live Bus Locations
 */
export async function getLiveBusesExample() {
  const apiClient = getAPIClient();
  
  try {
    const liveBuses = await apiClient.getLiveBuses();
    console.log('Live buses:', liveBuses);
    
    // Filter active buses
    const activeBuses = liveBuses.filter(bus => bus.isActive);
    console.log('Active buses:', activeBuses.length);
    
    return liveBuses;
  } catch (error) {
    console.error('Get live buses error:', error);
    throw error;
  }
}

/**
 * Example: Get Specific Bus Location
 */
export async function getBusLocationExample(busId: string) {
  const apiClient = getAPIClient();
  
  try {
    const busLocation = await apiClient.getBusLocation(busId);
    console.log('Bus location:', busLocation);
    
    return busLocation;
  } catch (error) {
    console.error('Get bus location error:', error);
    throw error;
  }
}

// ==================== USER MANAGEMENT EXAMPLES ====================

/**
 * Example: Get All Users (Admin Only)
 */
export async function getUsersExample() {
  const apiClient = getAPIClient();
  
  try {
    const users = await apiClient.getUsers();
    console.log('All users:', users);
    
    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Users by role:', usersByRole);
    return users;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}

/**
 * Example: Create New User (Admin Only)
 */
export async function createUserExample() {
  const apiClient = getAPIClient();
  
  try {
    const newUser = await apiClient.createUser({
      email: 'admin@example.com',
      password: 'adminpassword123',
      name: 'Admin User',
      role: 'ADMIN',
    });
    
    console.log('User created:', newUser);
    return newUser;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

// ==================== DRIVER MANAGEMENT EXAMPLES ====================

/**
 * Example: Register New Driver
 */
export async function registerDriverExample() {
  const apiClient = getAPIClient();
  
  try {
    const driverResponse = await apiClient.registerDriver({
      name: 'John Driver',
      phone: '+1234567890',
      licenseNumber: 'DL123456789',
      busId: 'bus-001',
      routeId: 'route-001',
      deviceId: 'device-123',
    });
    
    console.log('Driver registered:', driverResponse);
    return driverResponse;
  } catch (error) {
    console.error('Register driver error:', error);
    throw error;
  }
}

/**
 * Example: Get All Drivers (Admin Only)
 */
export async function getDriversExample() {
  const apiClient = getAPIClient();
  
  try {
    const drivers = await apiClient.getDrivers();
    console.log('All drivers:', drivers);
    
    // Filter active drivers
    const activeDrivers = drivers.filter(driver => driver.isActive);
    console.log('Active drivers:', activeDrivers.length);
    
    return drivers;
  } catch (error) {
    console.error('Get drivers error:', error);
    throw error;
  }
}

// ==================== ERROR HANDLING EXAMPLES ====================

/**
 * Example: Comprehensive Error Handling
 */
export async function errorHandlingExample() {
  const apiClient = getAPIClient();
  
  try {
    // This will likely fail with invalid credentials
    await apiClient.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Login failed:', error.message);
      
      // Handle specific error types
      if (error.message.includes('Invalid credentials')) {
        console.log('Show invalid credentials message to user');
      } else if (error.message.includes('Network')) {
        console.log('Show network error message to user');
      } else {
        console.log('Show generic error message to user');
      }
    }
  }
}

// ==================== UTILITY EXAMPLES ====================

/**
 * Example: Logout User
 */
export async function logoutExample() {
  const apiClient = getAPIClient();
  
  try {
    await apiClient.logout();
    console.log('User logged out successfully');
    
    // Verify logout
    const isAuthenticated = await apiClient.isAuthenticated();
    console.log('Is still authenticated:', isAuthenticated); // Should be false
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Example: Check API Health
 */
export async function healthCheckExample() {
  const apiClient = getAPIClient();
  
  try {
    const healthStatus = await apiClient.getHealthStatus();
    console.log('API health status:', healthStatus);
    
    return healthStatus;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}