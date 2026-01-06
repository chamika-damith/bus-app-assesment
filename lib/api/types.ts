import { z } from 'zod';

// ==================== AUTHENTICATION TYPES ====================

export const LoginCredentialsSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string().optional(),
    name: z.string(),
    role: z.enum(['DRIVER', 'PASSENGER']),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    driverId: z.string().optional(),
    busId: z.string().optional(),
    routeId: z.string().optional(),
    licenseNumber: z.string().optional(),
    uiMode: z.enum(['SIMPLE', 'MODERN']).optional(),
    savedPlaces: z.array(z.any()).optional(),
    createdAt: z.string().optional(),
    lastLoginAt: z.string().optional(),
  }),
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  message: z.string().optional(),
  // Enhanced session data
  sessionId: z.string().optional(),
  sessionStartTime: z.number().optional(),
  sessionExpiresAt: z.number().optional(),
});

export const TokenResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const RegisterDataSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['DRIVER', 'PASSENGER']),
  deviceId: z.string().optional(),
  // Common fields
  nic: z.string().optional(),
  // Driver-specific fields
  route: z.string().optional(),
  vehicleNumber: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

// ==================== LOCATION TYPES ====================

export const LocationDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360),
  speed: z.number().min(0),
  accuracy: z.number().min(0),
  timestamp: z.number(),
});

export const LocationUpdateSchema = z.object({
  driverId: z.string(),
  busId: z.string(),
  routeId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360),
  speed: z.number().min(0),
  accuracy: z.number().min(0),
  status: z.enum(['active', 'idle', 'offline']),
  sessionId: z.string().optional(), // Enhanced with session validation
});

export const BusLocationSchema = z.object({
  busId: z.string(),
  routeId: z.string(),
  driverId: z.string(),
  location: LocationDataSchema,
  isActive: z.boolean(),
  lastUpdate: z.string(),
  estimatedArrival: z.string().optional(),
});

// ==================== USER MANAGEMENT TYPES ====================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  name: z.string(),
  role: z.enum(['DRIVER', 'PASSENGER']),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  driverId: z.string().optional(),
  busId: z.string().optional(),
  routeId: z.string().optional(),
  licenseNumber: z.string().optional(),
  uiMode: z.enum(['SIMPLE', 'MODERN']).optional(),
  savedPlaces: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  assignedRoute: z.string().optional(), // For backward compatibility
});

export const CreateUserDataSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().min(2),
  role: z.enum(['DRIVER', 'PASSENGER']),
  password: z.string().min(8),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

export const UpdateUserDataSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['DRIVER', 'PASSENGER']).optional(),
  uiMode: z.enum(['SIMPLE', 'MODERN']).optional(),
  assignedRoute: z.string().optional(), // For backward compatibility
}).partial();

// ==================== DRIVER TYPES ====================

export const DriverRegistrationSchema = z.object({
  name: z.string().min(2),
  phone: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  licenseNumber: z.string(),
  busId: z.string(),
  routeId: z.string(),
  deviceId: z.string().optional(), // Make deviceId optional since it's generated automatically
});

export const DriverResponseSchema = z.object({
  success: z.boolean(),
  driverId: z.string().optional(),
  message: z.string(),
  driver: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    licenseNumber: z.string(),
    busId: z.string(),
    routeId: z.string(),
    isActive: z.boolean(),
    lastSeen: z.number(),
  }).optional(),
});

export const DriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  licenseNumber: z.string(),
  busId: z.string(),
  routeId: z.string(),
  isActive: z.boolean(),
  lastSeen: z.number(),
  location: LocationDataSchema.optional(),
});

// ==================== SESSION MANAGEMENT TYPES ====================

export const SessionValidationSchema = z.object({
  sessionId: z.string(),
});

export const SessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    sessionId: z.string(),
    driverId: z.string(),
    deviceId: z.string(),
    startTime: z.number(),
    lastActivity: z.number(),
    expiresAt: z.number(),
    isActive: z.boolean(),
  }).optional(),
});

export const ActiveSessionSchema = z.object({
  sessionId: z.string(),
  driverId: z.string(),
  deviceId: z.string(),
  startTime: z.number(),
  lastActivity: z.number(),
  expiresAt: z.number(),
  isActive: z.boolean(),
});

export const SessionStatsSchema = z.object({
  totalActiveSessions: z.number(),
  averageSessionDuration: z.number(),
  oldestSession: z.number().nullable(),
});

// ==================== ERROR TYPES ====================

export const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string(),
});

// ==================== ROUTE TYPES ====================

export const BusStopSchema = z.object({
  stopId: z.string(),
  name: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  order: z.number(),
});

export const ScheduleSchema = z.object({
  stopId: z.string(),
  arrivalTime: z.string(),
  departureTime: z.string(),
});

export const RouteSchema = z.object({
  routeId: z.string(),
  routeName: z.string(),
  routeNumber: z.string(),
  stops: z.array(BusStopSchema),
  schedule: z.array(ScheduleSchema),
});

// ==================== TYPE EXPORTS ====================

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type RegisterData = z.infer<typeof RegisterDataSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;
export type BusLocation = z.infer<typeof BusLocationSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserDataSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserDataSchema>;
export type DriverRegistration = z.infer<typeof DriverRegistrationSchema>;
export type DriverResponse = z.infer<typeof DriverResponseSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type SessionValidation = z.infer<typeof SessionValidationSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type ActiveSession = z.infer<typeof ActiveSessionSchema>;
export type SessionStats = z.infer<typeof SessionStatsSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type BusStop = z.infer<typeof BusStopSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Route = z.infer<typeof RouteSchema>;

// ==================== API CLIENT INTERFACES ====================

export interface APIClient {
  // Authentication
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(userData: RegisterData): Promise<AuthResponse>;
  refreshToken(): Promise<TokenResponse>;
  
  // Session Management
  validateSession(sessionId: string): Promise<SessionResponse>;
  logoutDriver(sessionId: string): Promise<void>;
  
  // GPS and Location
  updateDriverLocation(locationData: LocationUpdate): Promise<void>;
  getLiveBuses(): Promise<BusLocation[]>;
  getBusLocation(busId: string): Promise<BusLocation>;
  getBusHistory(busId: string): Promise<LocationData[]>;
  
  // User Management
  getUsers(): Promise<User[]>;
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(userId: string, userData: UpdateUserData): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Driver Management
  getDrivers(): Promise<Driver[]>;
  registerDriver(driverData: DriverRegistration): Promise<DriverResponse>;
  removeDriver(driverId: string): Promise<void>;
  getDriverStats(): Promise<any>;
  
  // Session Management (Admin)
  getActiveSessions(): Promise<ActiveSession[]>;
  getSessionStats(): Promise<SessionStats>;
  forceEndSession(sessionId: string): Promise<void>;
}

// ==================== HTTP CLIENT TYPES ====================

export interface HTTPClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>;
  onResponseError?: (error: any) => any;
}