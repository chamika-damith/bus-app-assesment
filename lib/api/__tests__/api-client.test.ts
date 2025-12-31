import { BusTrackingAPIClient } from '../client';
import { TokenManager, UserDataManager, DeviceManager } from '../storage';

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

describe('BusTrackingAPIClient', () => {
  let apiClient: BusTrackingAPIClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new BusTrackingAPIClient('http://localhost:5000');
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'PASSENGER' as const,
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(TokenManager.setTokens).toHaveBeenCalledWith('mock-token', 'mock-refresh-token');
      expect(UserDataManager.setUserData).toHaveBeenCalledWith(mockResponse.user);
    });

    it('should handle login failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials',
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
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });

    it('should validate login credentials', async () => {
      await expect(
        apiClient.login({
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('GPS and Location', () => {
    it('should update driver location successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      await expect(
        apiClient.updateDriverLocation({
          driverId: 'driver-1',
          busId: 'bus-1',
          routeId: 'route-1',
          latitude: 37.7749,
          longitude: -122.4194,
          heading: 90,
          speed: 25,
          accuracy: 5,
          status: 'active',
        })
      ).resolves.not.toThrow();
    });

    it('should validate location data', async () => {
      await expect(
        apiClient.updateDriverLocation({
          driverId: 'driver-1',
          busId: 'bus-1',
          routeId: 'route-1',
          latitude: 200, // Invalid latitude
          longitude: -122.4194,
          heading: 90,
          speed: 25,
          accuracy: 5,
          status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should get live buses successfully', async () => {
      const mockDrivers = [
        {
          id: 'driver-1',
          busId: 'bus-1',
          routeId: 'route-1',
          isActive: true,
          lastSeen: Date.now(),
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
            heading: 90,
            speed: 25,
            accuracy: 5,
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDrivers,
      } as Response);

      const result = await apiClient.getLiveBuses();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        busId: 'bus-1',
        routeId: 'route-1',
        driverId: 'driver-1',
        isActive: true,
      });
    });
  });

  describe('Utility Methods', () => {
    it('should check authentication status', async () => {
      (TokenManager.hasAuthToken as jest.Mock).mockResolvedValue(true);

      const result = await apiClient.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should get current user', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'PASSENGER' as const,
      };

      (UserDataManager.getUserData as jest.Mock).mockResolvedValue(mockUser);

      const result = await apiClient.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should logout successfully', async () => {
      await apiClient.logout();

      expect(TokenManager.clearTokens).toHaveBeenCalled();
      expect(UserDataManager.removeUserData).toHaveBeenCalled();
    });
  });
});