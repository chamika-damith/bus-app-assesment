// ==================== MAIN API CLIENT EXPORTS ====================

export { 
  BusTrackingAPIClient, 
  getAPIClient, 
  initializeAPIClient 
} from './client';

// ==================== TYPE EXPORTS ====================

export type {
  // Authentication types
  LoginCredentials,
  AuthResponse,
  TokenResponse,
  RegisterData,
  
  // Location types
  LocationData,
  LocationUpdate,
  BusLocation,
  
  // User types
  User,
  CreateUserData,
  UpdateUserData,
  
  // Driver types
  Driver,
  DriverRegistration,
  DriverResponse,
  
  // Route types
  Route,
  BusStop,
  Schedule,
  
  // Error types
  APIError,
  
  // HTTP client types
  HTTPClientConfig,
  RequestConfig,
  ResponseData,
  RequestInterceptor,
  ResponseInterceptor,
  
  // API client interface
  APIClient,
} from './types';

// ==================== SCHEMA EXPORTS ====================

export {
  // Authentication schemas
  LoginCredentialsSchema,
  AuthResponseSchema,
  TokenResponseSchema,
  RegisterDataSchema,
  
  // Location schemas
  LocationDataSchema,
  LocationUpdateSchema,
  BusLocationSchema,
  
  // User schemas
  UserSchema,
  CreateUserDataSchema,
  UpdateUserDataSchema,
  
  // Driver schemas
  DriverSchema,
  DriverRegistrationSchema,
  DriverResponseSchema,
  
  // Route schemas
  RouteSchema,
  BusStopSchema,
  ScheduleSchema,
  
  // Error schemas
  APIErrorSchema,
} from './types';

// ==================== STORAGE EXPORTS ====================

export {
  SecureStorageService,
  TokenManager,
  UserDataManager,
  DeviceManager,
  STORAGE_KEYS,
} from './storage';

// ==================== CONFIGURATION EXPORTS ====================

export {
  API_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_HEADERS,
  getEnvironmentConfig,
} from './config';

// ==================== HTTP CLIENT EXPORTS ====================

export {
  HTTPClient,
  AuthenticatedHTTPClient,
  HTTPError,
  NetworkError,
  TimeoutError,
  createHTTPClient,
  createAuthenticatedHTTPClient,
} from './http-client';

// ==================== CONVENIENCE EXPORTS ====================

import { getAPIClient } from './client';
import { TokenManager, UserDataManager, DeviceManager } from './storage';

/**
 * Default API client instance
 * Use this for most API calls throughout the app
 */
export const apiClient = getAPIClient();

/**
 * Re-export commonly used storage managers
 */
export const tokenManager = TokenManager;
export const userDataManager = UserDataManager;
export const deviceManager = DeviceManager;