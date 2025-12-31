# Bus Tracking API Client

A comprehensive TypeScript API client for the Bus Tracking Backend, providing secure authentication, real-time GPS tracking, and user management capabilities.

## Features

- 🔐 **Secure Authentication** - JWT token management with automatic refresh
- 📍 **Real-time GPS Tracking** - Live bus location updates and tracking
- 👥 **User Management** - Complete CRUD operations for users and drivers
- 🔒 **Secure Storage** - Encrypted token storage using Expo SecureStore
- ✅ **Type Safety** - Full TypeScript support with Zod validation
- 🌐 **HTTP Client** - Robust HTTP client with interceptors and error handling
- 📱 **Offline Support** - Request queuing and retry mechanisms
- 🧪 **Well Tested** - Comprehensive test suite with Jest

## Installation

The API client is already installed as part of this project. All dependencies are included in the main `package.json`.

## Quick Start

```typescript
import { getAPIClient } from '@/lib/api';

// Get the singleton API client instance
const apiClient = getAPIClient();

// Login user
const authResponse = await apiClient.login({
  email: 'user@example.com',
  password: 'password123',
});

// Get live bus locations
const liveBuses = await apiClient.getLiveBuses();
```

## Configuration

The API client can be configured through environment variables:

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_PROD_API_URL=https://api.yourapp.com
```

## Core Components

### 1. API Client (`BusTrackingAPIClient`)

The main API client class that implements all backend communication:

```typescript
import { BusTrackingAPIClient, getAPIClient } from '@/lib/api';

// Use singleton instance (recommended)
const apiClient = getAPIClient();

// Or create custom instance
const customClient = new BusTrackingAPIClient('https://custom-api.com');
```

### 2. Authentication

```typescript
// Login
const authResponse = await apiClient.login({
  email: 'user@example.com',
  password: 'password123',
});

// Register
const registerResponse = await apiClient.register({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User',
  role: 'PASSENGER',
});

// Check authentication status
const isAuthenticated = await apiClient.isAuthenticated();
const currentUser = await apiClient.getCurrentUser();

// Logout
await apiClient.logout();
```

### 3. GPS and Location Tracking

```typescript
// Update driver location
await apiClient.updateDriverLocation({
  driverId: 'driver-123',
  busId: 'bus-456',
  routeId: 'route-789',
  latitude: 37.7749,
  longitude: -122.4194,
  heading: 90,
  speed: 25,
  accuracy: 5,
  status: 'active',
});

// Get live bus locations
const liveBuses = await apiClient.getLiveBuses();

// Get specific bus location
const busLocation = await apiClient.getBusLocation('bus-123');

// Get bus location history
const history = await apiClient.getBusHistory('bus-123');
```

### 4. User Management (Admin Only)

```typescript
// Get all users
const users = await apiClient.getUsers();

// Create new user
const newUser = await apiClient.createUser({
  email: 'admin@example.com',
  password: 'adminpass123',
  name: 'Admin User',
  role: 'ADMIN',
});

// Update user
const updatedUser = await apiClient.updateUser('user-123', {
  name: 'Updated Name',
  uiMode: 'SIMPLE',
});

// Delete user
await apiClient.deleteUser('user-123');
```

### 5. Driver Management

```typescript
// Register new driver
const driverResponse = await apiClient.registerDriver({
  name: 'John Driver',
  phone: '+1234567890',
  licenseNumber: 'DL123456789',
  busId: 'bus-001',
  routeId: 'route-001',
  deviceId: 'device-123',
});

// Get all drivers (admin only)
const drivers = await apiClient.getDrivers();

// Remove driver (admin only)
await apiClient.removeDriver('driver-123');

// Get driver statistics (admin only)
const stats = await apiClient.getDriverStats();
```

## Storage Management

The API client includes secure storage utilities:

```typescript
import { TokenManager, UserDataManager, DeviceManager } from '@/lib/api';

// Token management
await TokenManager.setAuthToken('jwt-token');
const token = await TokenManager.getAuthToken();
await TokenManager.clearTokens();

// User data management
await UserDataManager.setUserData(userData);
const user = await UserDataManager.getUserData();

// Device management
const deviceId = await DeviceManager.getDeviceId();
```

## Error Handling

The API client provides comprehensive error handling:

```typescript
import { HTTPError, NetworkError, TimeoutError } from '@/lib/api';

try {
  await apiClient.login(credentials);
} catch (error) {
  if (error instanceof HTTPError) {
    console.error('HTTP Error:', error.status, error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network Error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Timeout Error:', error.message);
  } else {
    console.error('Unknown Error:', error);
  }
}
```

## Type Safety

All API methods are fully typed with TypeScript and validated with Zod schemas:

```typescript
import type { 
  User, 
  LoginCredentials, 
  LocationUpdate, 
  BusLocation 
} from '@/lib/api';

// TypeScript will enforce correct types
const credentials: LoginCredentials = {
  email: 'user@example.com', // Must be valid email
  password: 'password123',   // Required
};

const location: LocationUpdate = {
  driverId: 'driver-123',
  busId: 'bus-456',
  routeId: 'route-789',
  latitude: 37.7749,        // Must be between -90 and 90
  longitude: -122.4194,     // Must be between -180 and 180
  heading: 90,              // Must be between 0 and 360
  speed: 25,                // Must be >= 0
  accuracy: 5,              // Must be >= 0
  status: 'active',         // Must be 'active', 'idle', or 'offline'
};
```

## Integration with React Context

The API client integrates seamlessly with the AuthContext:

```typescript
// context/AuthContext.tsx
import { getAPIClient } from '@/lib/api';

const apiClient = getAPIClient();

const login = async (email: string, password: string) => {
  const authResponse = await apiClient.login({ email, password });
  if (authResponse.success) {
    setUser(authResponse.user);
    setAuthToken(authResponse.token);
  }
};
```

## Testing

The API client includes comprehensive tests:

```bash
# Run all API tests
npm test lib/api

# Run specific test file
npm test lib/api/__tests__/api-client.test.ts

# Run tests with coverage
npm run test:coverage
```

## Configuration Options

The API client can be configured through the `API_CONFIG` object:

```typescript
import { API_CONFIG } from '@/lib/api';

// Default configuration
console.log(API_CONFIG.BASE_URL);     // API base URL
console.log(API_CONFIG.TIMEOUT);      // Request timeout
console.log(API_CONFIG.RETRY);        // Retry configuration
console.log(API_CONFIG.LOCATION);     // Location update intervals
```

## Backend API Endpoints

The client communicates with these backend endpoints:

- **Authentication**: `/api/gps/driver/login`, `/api/gps/driver/register`
- **GPS Tracking**: `/api/gps/driver/location`, `/api/gps/buses/live`
- **User Management**: `/api/users/*`
- **Driver Management**: `/api/gps/admin/drivers`
- **System**: `/api/health`

## Security Features

- 🔐 JWT token authentication with automatic refresh
- 🔒 Secure token storage using Expo SecureStore
- 🛡️ Request/response validation with Zod schemas
- 🌐 HTTPS-only communication in production
- 🔑 Certificate pinning support (configurable)
- 📱 Device ID generation and management

## Performance Features

- ⚡ Request caching and deduplication
- 🔄 Automatic retry with exponential backoff
- 📱 Offline request queuing
- 🎯 Optimized location update intervals
- 💾 Efficient data storage and retrieval

## Development

For development and debugging:

```typescript
import { getEnvironmentConfig } from '@/lib/api';

const config = getEnvironmentConfig();
console.log('Development mode:', config.isDevelopment);
console.log('API URL:', config.apiUrl);
console.log('Logging enabled:', config.enableLogging);
```

## Examples

See `lib/api/examples.ts` for comprehensive usage examples covering all API client features.

## Support

For issues or questions about the API client, please check:

1. The examples in `lib/api/examples.ts`
2. The test files in `lib/api/__tests__/`
3. The type definitions in `lib/api/types.ts`
4. The configuration in `lib/api/config.ts`