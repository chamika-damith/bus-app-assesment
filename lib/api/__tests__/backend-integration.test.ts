import { BusTrackingAPIClient } from '../client';

// Mock the storage modules
jest.mock('../storage', () => ({
  TokenManager: {
    setTokens: jest.fn(),
    getAuthToken: jest.fn(),
    getRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
    hasAuthToken: jest.fn(),
  },
  UserDataManager: {
    setUserData: jest.fn(),
    getUserData: jest.fn(),
    removeUserData: jest.fn(),
  },
  DeviceManager: {
    getDeviceId: jest.fn().mockResolvedValue('test-device-id'),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('Backend Integration', () => {
  let apiClient: BusTrackingAPIClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new BusTrackingAPIClient('http://localhost:5000');
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a passenger user with backend format', async () => {
      const mockBackendResponse = {
        success: true,
        data: {
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          telephone: '+1234567890',
          nic: 'TEMP_NIC_123',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockBackendResponse,
      } as Response);

      const result = await apiClient.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'PASSENGER',
        phone: '+1234567890',
      });

      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Test User');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('PASSENGER');
      expect(result.user.phone).toBe('+1234567890');
    });

    it('should register a driver with backend format', async () => {
      const mockDriverResponse = {
        success: true,
        data: {
          driverId: 'driver_123',
          name: 'Driver User',
          phone: '+1234567890',
          licenseNumber: 'TEMP_LICENSE',
          busId: 'TEMP_BUS',
          routeId: 'TEMP_ROUTE',
          deviceId: 'test-device-id',
          isActive: false,
        },
        message: 'Driver registered successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDriverResponse,
      } as Response);

      const result = await apiClient.register({
        name: 'Driver User',
        phone: '+1234567890',
        password: 'password123',
        role: 'DRIVER',
      });

      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Driver User');
      expect(result.user.role).toBe('DRIVER');
      expect(result.user.driverId).toBe('driver_123');
    });

    it('should handle backend validation errors', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Error creating user',
        error: 'Email already exists',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockErrorResponse,
      } as Response);

      await expect(
        apiClient.register({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'PASSENGER',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Driver Login', () => {
    it('should login driver with phone and deviceId', async () => {
      const mockDriverLoginResponse = {
        success: true,
        data: {
          driverId: 'driver_123',
          name: 'Driver User',
          phone: '+1234567890',
          licenseNumber: 'DL123456',
          busId: 'bus_001',
          routeId: 'route_001',
          deviceId: 'test-device-id',
          isActive: true,
          lastSeen: Date.now(),
        },
        message: 'Authentication successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDriverLoginResponse,
      } as Response);

      const result = await apiClient.login({
        phone: '+1234567890',
        password: 'password123', // Not used in driver login, but required by our schema
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('DRIVER');
      expect(result.user.driverId).toBe('driver_123');
      expect(result.token).toContain('driver_session_');
    });

    it('should handle driver login failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Authentication failed',
        error: 'Invalid phone number or device ID',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockErrorResponse,
      } as Response);

      await expect(
        apiClient.login({
          phone: '+9999999999',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });
  });

  describe('Email Login (Mock)', () => {
    it('should handle email login with mock authentication', async () => {
      const result = await apiClient.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.email).toBe('admin@example.com');
      expect(result.token).toContain('user_session_');
      expect(result.message).toContain('demo mode');
    });

    it('should assign correct roles based on email', async () => {
      const passengerResult = await apiClient.login({
        email: 'passenger@example.com',
        password: 'password123',
      });

      expect(passengerResult.user.role).toBe('PASSENGER');

      const adminResult = await apiClient.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(adminResult.user.role).toBe('ADMIN');
    });
  });
});