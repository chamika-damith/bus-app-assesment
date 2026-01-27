// ==================== API CONFIGURATION ====================

/**
 * API Configuration
 * Centralized configuration for the API client
 */
export const API_CONFIG = {
  // Base URL for the API
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://bustracking-backend-ehnq.onrender.com/api',
  
  // Request timeout in milliseconds
  TIMEOUT: 15000, // 15 seconds
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_FACTOR: 2,
  },
  
  // Token configuration
  TOKEN: {
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    AUTO_REFRESH: true,
  },
  
  // Cache configuration
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Maximum number of cached items
  },
  
  // Location update configuration
  LOCATION: {
    DRIVER_UPDATE_INTERVAL: 15000, // 15 seconds
    PASSENGER_UPDATE_INTERVAL: 30000, // 30 seconds
    HIGH_ACCURACY: true,
    TIMEOUT: 10000, // 10 seconds
    MAXIMUM_AGE: 60000, // 1 minute
  },
  
  // Offline configuration
  OFFLINE: {
    QUEUE_SIZE: 100, // Maximum number of queued requests
    SYNC_INTERVAL: 30000, // 30 seconds
    RETRY_FAILED_REQUESTS: true,
  },
  
  // Development configuration
  DEV: {
    ENABLE_LOGGING: process.env.NODE_ENV === 'development',
    LOG_REQUESTS: process.env.NODE_ENV === 'development',
    LOG_RESPONSES: process.env.NODE_ENV === 'development',
    MOCK_DELAYS: false,
  },
} as const;

/**
 * Environment-specific configurations
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = !isDevelopment;
  
  return {
    isDevelopment,
    isProduction,
    
    // API URL based on environment
    apiUrl: isDevelopment 
      ? API_CONFIG.BASE_URL 
      : process.env.EXPO_PUBLIC_PROD_API_URL || API_CONFIG.BASE_URL,
    
    // Timeout based on environment
    timeout: isDevelopment 
      ? API_CONFIG.TIMEOUT * 2 // Longer timeout in development
      : API_CONFIG.TIMEOUT,
    
    // Logging based on environment
    enableLogging: isDevelopment,
    
    // Security settings
    enableCertificatePinning: isProduction,
    enableRequestSigning: isProduction,
  };
};

/**
 * API Endpoints
 * Centralized endpoint definitions
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/gps/driver/login', // Driver login endpoint
    REGISTER_DRIVER: '/gps/driver/register',
    REGISTER_USER: '/users',
    REFRESH: '/auth/refresh', // Not implemented in backend yet
    LOGOUT: '/gps/driver/logout', // Enhanced driver logout
    VALIDATE_SESSION: '/gps/driver/validate-session', // Session validation
    UPDATE_STATUS: '/gps/driver/status', // Driver online/offline status
    GET_STATUS: (driverId: string) => `/gps/driver/status/${driverId}`, // Get driver status
  },
  
  // GPS and Location
  GPS: {
    UPDATE_LOCATION: '/gps/driver/location',
    GET_DRIVER_LOCATION: (driverId: string) => `/gps/driver/location/${driverId}`,
    GET_LIVE_BUSES: '/gps/buses/live',
    GET_BUS_LOCATION: (busId: string) => `/gps/bus/${busId}/location`,
    GET_BUS_HISTORY: (busId: string) => `/gps/bus/${busId}/history`,
  },
  
  // User Management
  USERS: {
    GET_ALL: '/users',
    GET_ONE: (userId: string) => `/users/${userId}`,
    CREATE: '/users',
    UPDATE: (userId: string) => `/users/${userId}`,
    DELETE: (userId: string) => `/users/${userId}`,
    LOGIN: '/users/login',
  },
  
  // Driver Management
  DRIVERS: {
    GET_ALL: '/gps/admin/drivers',
    GET_DETAILS: (driverId: string) => `/gps/driver/details/${driverId}`,
    REGISTER: '/gps/driver/register',
    REMOVE: (driverId: string) => `/gps/admin/driver/${driverId}`,
    GET_STATS: '/gps/admin/stats',
  },
  
  // Session Management (Admin)
  SESSIONS: {
    GET_ACTIVE: '/gps/admin/sessions',
    GET_STATS: '/gps/admin/session-stats',
    FORCE_END: (sessionId: string) => `/gps/admin/session/${sessionId}`,
  },

  // Routes
  ROUTES: {
    GET_ALL: '/routes',
    GET_ONE: (routeId: string) => `/routes/${routeId}`,
    CREATE: '/routes',
    UPDATE: (routeId: string) => `/routes/${routeId}`,
    DELETE: (routeId: string) => `/routes/${routeId}`,
    GET_NEARBY: '/routes/nearby',
    GET_STATS: '/routes/stats',
  },
  
  // System
  SYSTEM: {
    HEALTH: '/health',
    VERSION: '/version',
  },
  
  // Timetables (if needed)
  TIMETABLES: {
    GET_ALL: '/timetables',
    GET_ONE: (timetableId: string) => `/timetables/${timetableId}`,
  },
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // GPS errors
  GPS_UNAVAILABLE: 'GPS_UNAVAILABLE',
  LOCATION_PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
  LOCATION_TIMEOUT: 'LOCATION_TIMEOUT',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Version': '1.0.0',
  'X-Platform': 'mobile',
} as const;
