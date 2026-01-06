import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bell, BellOff, Users, MapPin, Clock, RefreshCw } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

const { width, height } = Dimensions.get('window');

interface BusInfo {
  id: string;
  routeNumber: string;
  routeName: string;
  arrivalTime: string;
  isLive: boolean;
  crowdLevel: 'low' | 'medium' | 'high';
  distanceToUser: number;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  lastUpdate?: string;
  driverName?: string;
  speed?: number;
}

export default function BusTracking() {
  const params = useLocalSearchParams();
  const busId = params.busId as string;
  const routeId = params.routeId as string;
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffRoute, setIsOffRoute] = useState(false);

  const apiClient = getAPIClient();

  // Helper function to calculate ETA
  const calculateETA = (lat: number, lng: number, speed: number): string => {
    // Simple ETA calculation based on distance and speed
    // In real app, use proper route calculation
    const userLat = 6.9271; // Default Colombo coordinates
    const userLng = 79.8612;
    
    const distance = calculateDistance(lat, lng, userLat, userLng);
    const timeInHours = distance / Math.max(speed, 10); // Minimum 10 km/h
    const timeInMinutes = Math.round(timeInHours * 60);
    
    return `${Math.max(1, timeInMinutes)} min`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    loadBusInfo();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadBusInfo, 30000);
    return () => clearInterval(interval);
  }, [busId]);

  const loadBusInfo = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Loading bus info for:', busId);

      if (busId) {
        // Get specific bus location using the correct API endpoint
        const API_BASE_URL = 'http://192.168.204.176:5001/api'; // Use same URL as map component
        const response = await fetch(`${API_BASE_URL}/gps/bus/${busId}/location`);
        const busLocationData = await response.json();
        
        if (busLocationData.success && busLocationData.data) {
          const busData = busLocationData.data;
          const routeNumber = busId.split('_')[1] || 'Unknown';
          
          setBusInfo({
            id: busId,
            routeNumber: routeNumber,
            routeName: `Route ${busData.routeId || routeNumber}`,
            arrivalTime: busData.estimatedArrival || calculateETA(busData.latitude, busData.longitude, busData.speed || 0),
            isLive: busData.isOnline !== false,
            crowdLevel: 'medium', // Default value - could be enhanced
            distanceToUser: 0, // Would need user location to calculate
            currentLocation: {
              latitude: busData.latitude || 0,
              longitude: busData.longitude || 0,
            },
            lastUpdate: busData.lastSeen ? new Date(busData.lastSeen).toLocaleString() : 'Just now',
            speed: busData.speed || 0,
          });
        } else {
          throw new Error(busLocationData.message || 'Bus not found or offline');
        }
      } else {
        // Get online drivers from driver list API
        const drivers = await apiClient.getDrivers();
        const onlineDrivers = drivers.filter(d => d.isOnline || d.isActive);
        
        if (onlineDrivers.length > 0) {
          const firstDriver = onlineDrivers[0];
          const routeNumber = firstDriver.routeId || firstDriver.route || 'Unknown';
          
          // Use last known location or default Colombo location
          const latitude = firstDriver.location?.latitude || 6.9271;
          const longitude = firstDriver.location?.longitude || 79.8612;
          
          setBusInfo({
            id: firstDriver.busId || firstDriver.vehicleNumber || 'unknown',
            routeNumber: routeNumber,
            routeName: `Route ${routeNumber}`,
            arrivalTime: calculateETA(latitude, longitude, 30), // Default 30 km/h
            isLive: true,
            crowdLevel: 'medium',
            distanceToUser: 0,
            currentLocation: {
              latitude: latitude,
              longitude: longitude,
            },
            lastUpdate: firstDriver.lastSeen ? new Date(firstDriver.lastSeen).toLocaleString() : 'Just now',
            driverName: firstDriver.name,
            speed: 0,
          });
        } else {
          throw new Error('No active buses found');
        }
      }

    } catch (err) {
      console.error('Error loading bus info:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bus information';
      setError(errorMessage);
      setBusInfo(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadBusInfo(true);
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return Colors.crowd.low;
      case 'medium': return Colors.crowd.medium;
      case 'high': return Colors.crowd.high;
      default: return Colors.gray[400];
    }
  };

  const getCrowdLevelText = (level: string) => {
    switch (level) {
      case 'low': return 'Less Crowded';
      case 'medium': return 'Moderately Crowded';
      case 'high': return 'Highly Crowded';
      default: return 'Unknown';
    }
  };

  const handleReportCrowd = () => {
    router.push(`/passenger/crowd-report?busId=${busId}`);
  };

  const handleOffRouteGuidance = () => {
    router.push(`/passenger/off-route-guidance?busId=${busId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bus Tracking</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw 
              size={24} 
              color={refreshing ? Colors.gray[400] : Colors.primary}
              style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bus information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!busInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bus Tracking</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bus not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Tracking</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw 
            size={24} 
            color={refreshing ? Colors.gray[400] : Colors.primary}
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Map Area */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: busInfo?.currentLocation.latitude || 6.9271,
            longitude: busInfo?.currentLocation.longitude || 79.8612,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={false}
        >
          {busInfo && (
            <Marker
              coordinate={{
                latitude: busInfo.currentLocation.latitude,
                longitude: busInfo.currentLocation.longitude,
              }}
              title={`Bus ${busInfo.routeNumber}`}
              description={`${busInfo.routeName} - ${busInfo.isLive ? 'Live' : 'Predicted'}`}
              pinColor={busInfo.isLive ? Colors.primary : Colors.gray[400]}
            />
          )}
        </MapView>
        
        {/* Live indicator overlay */}
        {busInfo?.isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Bus Info Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        {/* Bus Header */}
        <View style={styles.busHeader}>
          <View style={styles.routeNumberBadge}>
            <Text style={styles.routeNumber}>{busInfo.routeNumber}</Text>
          </View>
          <View style={styles.busHeaderInfo}>
            <Text style={styles.routeName}>{busInfo.routeName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.liveStatus}>
                <View style={styles.liveStatusDot} />
                <Text style={styles.liveStatusText}>
                  {busInfo.isLive ? 'Live tracking' : 'Predicted'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Arrival Time */}
        <View style={styles.arrivalSection}>
          <View style={styles.arrivalTimeContainer}>
            <Clock size={24} color={Colors.primary} />
            <Text style={styles.arrivalTime}>{busInfo.arrivalTime}</Text>
            <Text style={styles.arrivalLabel}>arrival time</Text>
          </View>
        </View>

        {/* Bus Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Users size={20} color={getCrowdLevelColor(busInfo.crowdLevel)} />
            <Text style={styles.detailLabel}>Crowd Level</Text>
            <Text style={[styles.detailValue, { color: getCrowdLevelColor(busInfo.crowdLevel) }]}>
              {getCrowdLevelText(busInfo.crowdLevel)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={20} color={Colors.text.secondary} />
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>
              {busInfo.distanceToUser.toFixed(1)} km away
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Report Crowd"
            onPress={handleReportCrowd}
            variant="outline"
            style={styles.actionButton}
          />
          
          {isOffRoute && (
            <Button
              title="Get Off-Route Guidance"
              onPress={handleOffRouteGuidance}
              style={styles.actionButton}
            />
          )}
        </View>

        {/* Notification Toggle */}
        <TouchableOpacity 
          style={styles.notificationToggle}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <View style={styles.notificationToggleContent}>
            {notificationsEnabled ? (
              <Bell size={20} color={Colors.primary} />
            ) : (
              <BellOff size={20} color={Colors.gray[400]} />
            )}
            <Text style={styles.notificationToggleText}>
              {notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
            </Text>
          </View>
          <Text style={styles.notificationSubtext}>
            Get notified 5 minutes before arrival
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  notificationButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.light,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  liveIndicator: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  routeNumberBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  busHeaderInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  liveStatusText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  arrivalSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  arrivalTimeContainer: {
    alignItems: 'center',
  },
  arrivalTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  arrivalLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  notificationToggle: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  notificationToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  notificationSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
});