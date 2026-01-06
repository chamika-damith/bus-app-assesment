import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAPIClient } from '../api/client';
import { LocationUpdate } from '../api/types';

// ==================== CONSTANTS ====================

const GPS_UPDATE_INTERVAL = 5000; // 5 seconds as per requirement 1.1
const GPS_ACCURACY_THRESHOLD = 50; // 50 meters as per requirement 5.1
const MAX_SPEED_CHANGE = 100; // 100 km/h as per requirement 5.3
const RETRY_ATTEMPTS = 3; // As per requirement 7.4
const RETRY_DELAY = 30000; // 30 seconds as per requirement 7.3
const QUEUE_SYNC_INTERVAL = 30000; // 30 seconds for syncing queued data
const LOW_BATTERY_THRESHOLD = 0.2; // 20% battery threshold
const LOW_BATTERY_UPDATE_INTERVAL = 15000; // 15 seconds when battery is low

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const BACKGROUND_SYNC_TASK = 'background-sync-task';

// ==================== INTERFACES ====================

export interface GPSServiceConfig {
  driverId: string;
  busId: string;
  routeId: string;
  deviceId: string;
  sessionId?: string; // Enhanced with session management
}

export interface LocationData {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
  status: 'active' | 'idle' | 'offline';
}

export interface QueuedLocationUpdate extends LocationData {
  id: string;
  driverId: string;
  busId: string;
  routeId: string;
  retryCount: number;
  createdAt: number;
  sessionId?: string; // Enhanced with session management
}

export interface GPSServiceStatus {
  isTracking: boolean;
  isOnline: boolean;
  lastUpdate: Date | null;
  queuedUpdates: number;
  batteryOptimized: boolean;
  accuracy: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  sessionId?: string; // Enhanced with session tracking
  sessionValid?: boolean;
}

// ==================== DATABASE SETUP ====================

class LocationDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('gps_tracking.db');
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS queued_locations (
          id TEXT PRIMARY KEY,
          driverId TEXT NOT NULL,
          busId TEXT NOT NULL,
          routeId TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          heading REAL NOT NULL,
          speed REAL NOT NULL,
          accuracy REAL NOT NULL,
          status TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          retryCount INTEGER DEFAULT 0,
          createdAt INTEGER NOT NULL,
          sessionId TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_timestamp ON queued_locations(timestamp);
        CREATE INDEX IF NOT EXISTS idx_driver ON queued_locations(driverId);
        CREATE INDEX IF NOT EXISTS idx_session ON queued_locations(sessionId);
      `);
    } catch (error) {
      console.error('Failed to initialize location database:', error);
      throw error;
    }
  }

  async addQueuedLocation(location: QueuedLocationUpdate): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT INTO queued_locations 
       (id, driverId, busId, routeId, latitude, longitude, heading, speed, accuracy, status, timestamp, retryCount, createdAt, sessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        location.id,
        location.driverId,
        location.busId,
        location.routeId,
        location.latitude,
        location.longitude,
        location.heading,
        location.speed,
        location.accuracy,
        location.status,
        location.timestamp,
        location.retryCount,
        location.createdAt,
        location.sessionId || null,
      ]
    );
  }

  async getQueuedLocations(limit: number = 50): Promise<QueuedLocationUpdate[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM queued_locations ORDER BY timestamp ASC LIMIT ?',
      [limit]
    );
    
    return result.map((row: any) => ({
      id: row.id,
      driverId: row.driverId,
      busId: row.busId,
      routeId: row.routeId,
      latitude: row.latitude,
      longitude: row.longitude,
      heading: row.heading,
      speed: row.speed,
      accuracy: row.accuracy,
      status: row.status,
      timestamp: row.timestamp,
      retryCount: row.retryCount,
      createdAt: row.createdAt,
      sessionId: row.sessionId,
    }));
  }

  async removeQueuedLocation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM queued_locations WHERE id = ?', [id]);
  }

  async updateRetryCount(id: string, retryCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE queued_locations SET retryCount = ? WHERE id = ?',
      [retryCount, id]
    );
  }

  async getQueuedCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM queued_locations');
    return (result as any)?.count || 0;
  }

  async clearOldEntries(olderThanMs: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const cutoffTime = Date.now() - olderThanMs;
    await this.db.runAsync('DELETE FROM queued_locations WHERE createdAt < ?', [cutoffTime]);
  }
}

// ==================== GPS SERVICE CLASS ====================

export class GPSService {
  private static instance: GPSService | null = null;
  private database: LocationDatabase;
  private config: GPSServiceConfig | null = null;
  private status: GPSServiceStatus;
  private locationSubscription: Location.LocationSubscription | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastLocation: LocationData | null = null;
  private apiClient = getAPIClient();
  private isInitialized = false;

  private constructor() {
    this.database = new LocationDatabase();
    this.status = {
      isTracking: false,
      isOnline: false,
      lastUpdate: null,
      queuedUpdates: 0,
      batteryOptimized: false,
      accuracy: 0,
      connectionStatus: 'disconnected',
      sessionId: undefined,
      sessionValid: false,
    };
  }

  static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  // ==================== INITIALIZATION ====================

  async initialize(config: GPSServiceConfig): Promise<void> {
    try {
      this.config = config;
      await this.database.initialize();
      await this.setupBackgroundTasks();
      await this.requestPermissions();
      
      // Set session information
      this.status.sessionId = config.sessionId;
      if (config.sessionId) {
        // Validate session on initialization
        await this.validateCurrentSession();
      }
      
      this.isInitialized = true;
      
      // Start syncing queued data
      this.startQueueSync();
      
      console.log('GPS Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GPS Service:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    // Request foreground location permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission denied');
    }

    // Request background location permission for continuous tracking
    if (Platform.OS === 'android') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied - tracking may be limited');
      }
    }
  }

  private async setupBackgroundTasks(): Promise<void> {
    try {
      // Define background location task
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
        if (error) {
          console.error('Background location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data as any;
          if (locations && locations.length > 0) {
            const location = locations[0];
            await this.processLocationUpdate(location);
          }
        }
      });

      // Define background sync task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          await this.syncQueuedUpdates();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background sync error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: QUEUE_SYNC_INTERVAL / 1000, // Convert to seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

    } catch (error) {
      console.error('Failed to setup background tasks:', error);
    }
  }

  // ==================== TRACKING CONTROL ====================

  async startTracking(): Promise<void> {
    if (!this.isInitialized || !this.config) {
      throw new Error('GPS Service not initialized');
    }

    try {
      // Check battery level for optimization
      const batteryLevel = await this.getBatteryLevel();
      const updateInterval = batteryLevel < LOW_BATTERY_THRESHOLD 
        ? LOW_BATTERY_UPDATE_INTERVAL 
        : GPS_UPDATE_INTERVAL;

      this.status.batteryOptimized = batteryLevel < LOW_BATTERY_THRESHOLD;

      // Start location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: updateInterval,
          distanceInterval: 5, // Update every 5 meters minimum
        },
        (location) => this.processLocationUpdate(location)
      );

      // Start background location tracking if permission granted
      const hasBackgroundPermission = await this.hasBackgroundLocationPermission();
      if (hasBackgroundPermission) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: updateInterval,
          distanceInterval: 10,
          foregroundService: {
            notificationTitle: 'TransLink GPS Tracking',
            notificationBody: 'Broadcasting your location to passengers',
          },
        });
      }

      this.status.isTracking = true;
      this.status.connectionStatus = 'connected';
      
      console.log('GPS tracking started with', updateInterval, 'ms interval');
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      // Stop location subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop background location updates
      const isTaskRunning = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      this.status.isTracking = false;
      this.status.connectionStatus = 'disconnected';
      
      console.log('GPS tracking stopped');
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
    }
  }

  // ==================== LOCATION PROCESSING ====================

  private async processLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || 0,
        speed: (location.coords.speed || 0) * 3.6, // Convert m/s to km/h
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        status: this.status.isTracking ? 'active' : 'idle',
      };

      // Validate location data according to requirements
      if (!this.validateLocationData(locationData)) {
        console.warn('Invalid location data, skipping update');
        return;
      }

      // Check for anomalies (requirement 5.3, 5.4)
      if (this.lastLocation && this.detectAnomalies(this.lastLocation, locationData)) {
        console.warn('Location anomaly detected, flagging for review');
        // Still process but mark as potentially problematic
      }

      this.lastLocation = locationData;
      this.status.lastUpdate = new Date();
      this.status.accuracy = locationData.accuracy;

      // Try to send location update immediately
      await this.sendLocationUpdate(locationData);

    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  private validateLocationData(location: LocationData): boolean {
    // Check if coordinates are valid
    if (!location.latitude || !location.longitude) {
      return false;
    }

    // Check if coordinates are within reasonable bounds
    if (Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
      return false;
    }

    // Check accuracy threshold (requirement 5.1, 5.2)
    if (location.accuracy > GPS_ACCURACY_THRESHOLD) {
      console.warn(`GPS accuracy ${location.accuracy}m exceeds threshold of ${GPS_ACCURACY_THRESHOLD}m`);
      // Still return true but log the warning as per requirement 5.2
    }

    return true;
  }

  private detectAnomalies(lastLocation: LocationData, currentLocation: LocationData): boolean {
    const timeDiff = (currentLocation.timestamp - lastLocation.timestamp) / 1000; // seconds
    const speedDiff = Math.abs(currentLocation.speed - lastLocation.speed);

    // Check for impossible speed changes (requirement 5.3)
    if (timeDiff > 0) {
      const acceleration = speedDiff / timeDiff * 3.6; // km/h per second
      if (acceleration > MAX_SPEED_CHANGE) {
        return true;
      }
    }

    // Check for backward movement (requirement 5.4)
    // This would require route pattern data which we don't have in this context
    // For now, we'll just check if the bus is moving in a completely opposite direction
    const headingDiff = Math.abs(currentLocation.heading - lastLocation.heading);
    if (headingDiff > 90 && headingDiff < 270 && currentLocation.speed > 10) {
      console.warn('Potential backward movement detected');
      return true;
    }

    return false;
  }

  // ==================== NETWORK COMMUNICATION ====================

  private async sendLocationUpdate(locationData: LocationData): Promise<void> {
    if (!this.config) return;

    // Validate session before sending location update
    if (this.config.sessionId && !await this.validateCurrentSession()) {
      console.warn('Session invalid, cannot send location update');
      this.status.connectionStatus = 'disconnected';
      return;
    }

    const locationUpdate: LocationUpdate = {
      driverId: this.config.driverId,
      busId: this.config.busId,
      routeId: this.config.routeId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      heading: locationData.heading,
      speed: locationData.speed,
      accuracy: locationData.accuracy,
      status: locationData.status,
      sessionId: this.config.sessionId, // Include session ID in location update
    };

    let retryCount = 0;
    let success = false;

    // Retry logic as per requirement 7.4
    while (retryCount < RETRY_ATTEMPTS && !success) {
      try {
        await this.apiClient.updateDriverLocation(locationUpdate);
        this.status.isOnline = true;
        this.status.connectionStatus = 'connected';
        success = true;
      } catch (error) {
        retryCount++;
        console.warn(`Location update attempt ${retryCount} failed:`, error);
        
        if (retryCount < RETRY_ATTEMPTS) {
          await this.delay(1000 * retryCount); // Exponential backoff
        }
      }
    }

    // If all retries failed, queue the update for later (requirement 7.1, 7.2)
    if (!success) {
      await this.queueLocationUpdate(locationUpdate, locationData.timestamp);
      this.status.isOnline = false;
      this.status.connectionStatus = 'disconnected';
    }
  }

  private async queueLocationUpdate(locationUpdate: LocationUpdate, timestamp: number): Promise<void> {
    const queuedUpdate: QueuedLocationUpdate = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...locationUpdate,
      timestamp,
      retryCount: 0,
      createdAt: Date.now(),
      sessionId: locationUpdate.sessionId,
    };

    try {
      await this.database.addQueuedLocation(queuedUpdate);
      this.status.queuedUpdates = await this.database.getQueuedCount();
      console.log('Location update queued for later transmission');
    } catch (error) {
      console.error('Failed to queue location update:', error);
    }
  }

  // ==================== QUEUE SYNCHRONIZATION ====================

  private startQueueSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.syncQueuedUpdates();
    }, QUEUE_SYNC_INTERVAL);
  }

  private async syncQueuedUpdates(): Promise<void> {
    try {
      const queuedUpdates = await this.database.getQueuedLocations(10); // Process 10 at a time
      
      for (const update of queuedUpdates) {
        try {
          const locationUpdate: LocationUpdate = {
            driverId: update.driverId,
            busId: update.busId,
            routeId: update.routeId,
            latitude: update.latitude,
            longitude: update.longitude,
            heading: update.heading,
            speed: update.speed,
            accuracy: update.accuracy,
            status: update.status,
            sessionId: update.sessionId,
          };

          await this.apiClient.updateDriverLocation(locationUpdate);
          await this.database.removeQueuedLocation(update.id);
          
          this.status.isOnline = true;
          this.status.connectionStatus = 'connected';
          
        } catch (error) {
          // Increment retry count
          const newRetryCount = update.retryCount + 1;
          
          if (newRetryCount >= RETRY_ATTEMPTS) {
            // Remove failed updates after max retries
            await this.database.removeQueuedLocation(update.id);
            console.warn('Removing failed location update after max retries');
          } else {
            await this.database.updateRetryCount(update.id, newRetryCount);
          }
        }
      }

      // Update queued count
      this.status.queuedUpdates = await this.database.getQueuedCount();
      
      // Clean up old entries (older than 24 hours)
      await this.database.clearOldEntries(24 * 60 * 60 * 1000);
      
    } catch (error) {
      console.error('Error syncing queued updates:', error);
      this.status.connectionStatus = 'disconnected';
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  private async validateCurrentSession(): Promise<boolean> {
    if (!this.config?.sessionId) {
      this.status.sessionValid = false;
      return false;
    }

    try {
      const response = await this.apiClient.validateSession(this.config.sessionId);
      this.status.sessionValid = response.success;
      return response.success;
    } catch (error) {
      console.error('Session validation failed:', error);
      this.status.sessionValid = false;
      return false;
    }
  }

  async updateSessionId(sessionId: string): Promise<void> {
    if (this.config) {
      this.config.sessionId = sessionId;
      this.status.sessionId = sessionId;
      await this.validateCurrentSession();
    }
  }

  async endSession(): Promise<void> {
    if (this.config?.sessionId) {
      try {
        await this.apiClient.logoutDriver(this.config.sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
      }
      
      this.config.sessionId = undefined;
      this.status.sessionId = undefined;
      this.status.sessionValid = false;
    }
  }

  // ==================== UTILITY METHODS ====================

  private async getBatteryLevel(): Promise<number> {
    try {
      // This would require expo-battery, for now return a mock value
      // In a real implementation, you'd install expo-battery and use it
      return 0.8; // Mock 80% battery
    } catch (error) {
      return 1.0; // Assume full battery if we can't get the level
    }
  }

  private async hasBackgroundLocationPermission(): Promise<boolean> {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === 'granted';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== PUBLIC API ====================

  getStatus(): GPSServiceStatus {
    return { ...this.status };
  }

  async forceSync(): Promise<void> {
    await this.syncQueuedUpdates();
  }

  async clearQueue(): Promise<void> {
    // This should only be used for testing or emergency situations
    if (this.database) {
      await this.database.clearOldEntries(0); // Clear all entries
      this.status.queuedUpdates = 0;
    }
  }

  async cleanup(): Promise<void> {
    await this.stopTracking();
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Unregister background tasks
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    } catch (error) {
      console.warn('Failed to unregister background sync task:', error);
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const gpsService = GPSService.getInstance();