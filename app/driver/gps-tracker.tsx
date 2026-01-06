import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  Settings,
  User,
  Bus,
  Battery,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { gpsService, GPSServiceStatus } from '../../lib/services/gps-service';

interface LocationData {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
}

interface DriverSession {
  driverId: string;
  busId: string;
  routeId: string;
  isTracking: boolean;
  startTime: number;
}

const API_BASE_URL = 'http://192.168.204.176:5001/api/gps'; // Updated to match backend API

export default function GPSTracker() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [session, setSession] = useState<DriverSession | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GPSServiceStatus>({
    isTracking: false,
    isOnline: false,
    lastUpdate: null,
    queuedUpdates: 0,
    batteryOptimized: false,
    accuracy: 0,
    connectionStatus: 'disconnected',
  });
  const [stats, setStats] = useState({
    totalDistance: 0,
    averageSpeed: 0,
    trackingTime: 0,
    lastUpdate: null as Date | null,
  });

  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeTracker();
    
    // Handle app state changes for background tracking
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, update status
        updateGPSStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, []);

  // Update GPS status periodically
  useEffect(() => {
    if (isTracking) {
      statusUpdateInterval.current = setInterval(() => {
        updateGPSStatus();
      }, 2000); // Update every 2 seconds
    } else {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
        statusUpdateInterval.current = null;
      }
    }

    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
      }
    };
  }, [isTracking]);

  const updateGPSStatus = () => {
    const status = gpsService.getStatus();
    setGpsStatus(status);
    
    // Update current location from GPS service if available
    if (status.lastUpdate && status.accuracy > 0) {
      // The GPS service doesn't expose current location directly,
      // but we can infer it's working from the status
      setStats(prev => ({
        ...prev,
        lastUpdate: status.lastUpdate,
      }));
    }
  };

  const initializeTracker = async () => {
    try {
      setIsLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required for GPS tracking.',
          [{ text: 'OK' }]
        );
        return;
      }
      setLocationPermission(true);

      // Check if driver is already logged in
      const savedSession = await AsyncStorage.getItem('@driver_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        
        // Initialize GPS service with session data
        await gpsService.initialize({
          driverId: parsedSession.driverId,
          busId: parsedSession.busId,
          routeId: parsedSession.routeId,
          deviceId: await getDeviceId(),
        });
        
        if (parsedSession.isTracking) {
          await startTracking();
        }
      } else {
        // Need to authenticate driver
        await authenticateDriver();
      }
    } catch (error) {
      console.error('Failed to initialize tracker:', error);
      Alert.alert('Initialization Error', 'Failed to initialize GPS tracker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateDriver = async () => {
    try {
      setIsLoading(true);
      
      // Use email-only authentication via API client
      const email = user?.email;
      if (!email) {
        Alert.alert('Authentication Failed', 'No email found for user. Please contact support.');
        return;
      }

      // In a real app, the password would come from:
      // 1. Secure storage (if previously saved)
      // 2. User input (login form)
      // 3. Biometric authentication
      // TODO: Implement secure password management
      
      const apiClient = getAPIClient();
      
      try {
        const authResponse = await apiClient.login({
          email,
          password: 'mypassword123', // This should come from secure storage or user input
        });

        if (authResponse.success && authResponse.user) {
          const newSession: DriverSession = {
            driverId: authResponse.user.driverId || authResponse.user.id,
            busId: authResponse.user.busId || 'BUS-001',
            routeId: authResponse.user.routeId || 'Route-001',
            isTracking: false,
            startTime: Date.now(),
          };
          
          // Also save session data for driver dashboard
          const dashboardSession = {
            driverId: newSession.driverId,
            sessionId: authResponse.sessionId || 'temp_session',
            busId: newSession.busId,
            routeId: newSession.routeId,
            isOnline: true,
          };
          
          setSession(newSession);
          await AsyncStorage.setItem('@driver_session', JSON.stringify(dashboardSession));
          
          // Initialize GPS service with session data (deviceId is generated automatically)
          const deviceId = await getDeviceId();
          await gpsService.initialize({
            driverId: newSession.driverId,
            busId: newSession.busId,
            routeId: newSession.routeId,
            deviceId,
          });
          
          updateGPSStatus();
          
          Alert.alert('Success', 'Authentication successful! GPS tracking is now active.');
        } else {
          Alert.alert('Authentication Failed', 'Login succeeded but no user data received.');
        }
      } catch (apiError) {
        console.error('API Client login error:', apiError);
        
        // If API client fails, try direct backend call as fallback
        console.log('Trying direct backend call as fallback...');
        
        const response = await fetch(`${API_BASE_URL}/driver/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: 'mypassword123',
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const newSession: DriverSession = {
            driverId: data.data.driverId,
            busId: data.data.busId,
            routeId: data.data.routeId,
            isTracking: false,
            startTime: Date.now(),
          };
          
          const dashboardSession = {
            driverId: data.data.driverId,
            sessionId: data.data.sessionId,
            busId: data.data.busId,
            routeId: data.data.routeId,
            isOnline: data.data.isActive || false,
          };
          
          setSession(newSession);
          await AsyncStorage.setItem('@driver_session', JSON.stringify(dashboardSession));
          
          const deviceId = await getDeviceId();
          await gpsService.initialize({
            driverId: newSession.driverId,
            busId: newSession.busId,
            routeId: newSession.routeId,
            deviceId,
          });
          
          updateGPSStatus();
          
          Alert.alert('Success', 'Authentication successful via direct backend call!');
        } else {
          Alert.alert('Authentication Failed', data.error || 'Both API client and direct backend calls failed.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceId = async (): Promise<string> => {
    let deviceId = await AsyncStorage.getItem('@device_id');
    if (!deviceId) {
      // Use expo-device for better device identification
      const deviceName = Device.deviceName || 'unknown';
      const osName = Device.osName || Platform.OS;
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 9);
      deviceId = `device_${osName}_${deviceName}_${timestamp}_${random}`.replace(/\s+/g, '_');
      await AsyncStorage.setItem('@device_id', deviceId);
    }
    return deviceId;
  };

  const startTracking = async () => {
    if (!locationPermission || !session) return;

    try {
      setIsLoading(true);
      
      // Start GPS service tracking
      await gpsService.startTracking();
      
      // Update session
      const updatedSession = { ...session, isTracking: true };
      setSession(updatedSession);
      await AsyncStorage.setItem('@driver_session', JSON.stringify(updatedSession));
      
      setIsTracking(true);
      updateGPSStatus();
      
      Alert.alert(
        'GPS Tracking Started',
        'Your location is now being broadcast to passengers. The app will continue tracking in the background.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert('Tracking Error', 'Failed to start GPS tracking. Please check your permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async () => {
    try {
      setIsLoading(true);
      
      // Stop GPS service tracking
      await gpsService.stopTracking();

      // Update session
      if (session) {
        const updatedSession = { ...session, isTracking: false };
        setSession(updatedSession);
        await AsyncStorage.setItem('@driver_session', JSON.stringify(updatedSession));
      }

      setIsTracking(false);
      updateGPSStatus();
      
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      Alert.alert('Error', 'Failed to stop GPS tracking.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = async () => {
    try {
      await gpsService.cleanup();
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
        statusUpdateInterval.current = null;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const handleTrackingToggle = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleForceSync = async () => {
    try {
      setIsLoading(true);
      await gpsService.forceSync();
      updateGPSStatus();
      Alert.alert('Sync Complete', 'Queued location updates have been synchronized.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to synchronize queued updates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getConnectionStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return Colors.success;
      case 'reconnecting': return Colors.warning;
      case 'disconnected': return Colors.danger;
      default: return Colors.gray[400];
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi size={20} color={Colors.success} />;
      case 'reconnecting': return <Clock size={20} color={Colors.warning} />;
      case 'disconnected': return <WifiOff size={20} color={Colors.danger} />;
      default: return <WifiOff size={20} color={Colors.gray[400]} />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing GPS Tracker...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <User size={48} color={Colors.gray[400]} />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorText}>
            Please ensure your email is registered as a driver to enable GPS tracking.
          </Text>
          <Button
            title="Retry Authentication"
            onPress={authenticateDriver}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bus size={24} color={Colors.primary} />
          <View style={styles.headerInfo}>
            <Text style={styles.busId}>Bus {session.busId}</Text>
            <Text style={styles.routeId}>Route {session.routeId}</Text>
          </View>
        </View>
        <View style={styles.connectionStatus}>
          {getConnectionStatusIcon(gpsStatus.connectionStatus)}
          {gpsStatus.batteryOptimized && (
            <Battery size={16} color={Colors.warning} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Enhanced Tracking Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>GPS Tracking</Text>
            <Switch
              value={isTracking}
              onValueChange={handleTrackingToggle}
              trackColor={{ false: Colors.gray[300], true: Colors.primary }}
              thumbColor={Colors.white}
              disabled={isLoading}
            />
          </View>
          <Text style={styles.statusText}>
            {isTracking ? 'Broadcasting your location to passengers' : 'Tracking is paused'}
          </Text>
          
          {/* Connection Status Details */}
          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getConnectionStatusColor(gpsStatus.connectionStatus) }]}>
                {gpsStatus.connectionStatus.charAt(0).toUpperCase() + gpsStatus.connectionStatus.slice(1)}
              </Text>
            </View>
            
            {gpsStatus.accuracy > 0 && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Accuracy:</Text>
                <Text style={[
                  styles.statusValue, 
                  { color: gpsStatus.accuracy <= 50 ? Colors.success : Colors.warning }
                ]}>
                  ±{gpsStatus.accuracy.toFixed(0)}m
                </Text>
              </View>
            )}
            
            {gpsStatus.queuedUpdates > 0 && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Queued:</Text>
                <Text style={[styles.statusValue, { color: Colors.warning }]}>
                  {gpsStatus.queuedUpdates} updates
                </Text>
              </View>
            )}
            
            {gpsStatus.batteryOptimized && (
              <View style={styles.statusItem}>
                <Battery size={14} color={Colors.warning} />
                <Text style={[styles.statusValue, { color: Colors.warning, marginLeft: 4 }]}>
                  Battery optimized
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* GPS Service Status */}
        {gpsStatus.accuracy > 0 && (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.locationTitle}>GPS Status</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>
                Accuracy: ±{gpsStatus.accuracy.toFixed(0)}m
                {gpsStatus.accuracy > 50 && ' (Poor signal)'}
              </Text>
              <Text style={styles.locationText}>
                Last Update: {gpsStatus.lastUpdate ? gpsStatus.lastUpdate.toLocaleTimeString() : 'Never'}
              </Text>
              {gpsStatus.queuedUpdates > 0 && (
                <Text style={[styles.locationText, { color: Colors.warning }]}>
                  Queued Updates: {gpsStatus.queuedUpdates}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Enhanced Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Session Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {gpsStatus.connectionStatus === 'connected' ? '✓' : '✗'}
              </Text>
              <Text style={styles.statLabel}>connection</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.trackingTime)}</Text>
              <Text style={styles.statLabel}>tracking</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {gpsStatus.lastUpdate ? gpsStatus.lastUpdate.toLocaleTimeString() : '--:--'}
              </Text>
              <Text style={styles.statLabel}>last update</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isTracking && styles.activeButton]}
            onPress={handleTrackingToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size={24} color={isTracking ? Colors.white : Colors.primary} />
            ) : isTracking ? (
              <Pause size={24} color={Colors.white} />
            ) : (
              <Play size={24} color={Colors.primary} />
            )}
            <Text style={[styles.controlButtonText, isTracking && styles.activeButtonText]}>
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>

          {/* Sync Button - only show when there are queued updates */}
          {gpsStatus.queuedUpdates > 0 && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleForceSync}
              disabled={isLoading}
            >
              <Database size={20} color={Colors.warning} />
              <Text style={styles.syncButtonText}>
                Sync {gpsStatus.queuedUpdates} Updates
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/driver/settings')}
          >
            <Settings size={20} color={Colors.text.secondary} />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
  },
  busId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  routeId: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  connectionStatus: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  locationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  locationDetails: {
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  controls: {
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 8,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  activeButtonText: {
    color: Colors.white,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  // New styles for enhanced GPS tracking
  statusDetails: {
    marginTop: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.warning,
    gap: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
});