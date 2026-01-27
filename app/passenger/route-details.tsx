import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, MapPin, X, Bus, Navigation, Radio, RefreshCw } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface BusInfo {
  busId: string;
  driverId: string;
  driverName: string;
  routeId: string;
  isTracking: boolean;
  lastUpdate: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  heading?: number;
}

export default function RouteDetails() {
  const params = useLocalSearchParams();
  const routeId = params.routeId as string;
  const routeNumber = params.routeNumber as string || routeId;
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiClient = getAPIClient();

  useEffect(() => {
    loadRouteBuses();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadRouteBuses(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [routeId]);

  const loadRouteBuses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('Loading buses for route:', routeNumber);

      // Get all live buses
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bustracking-backend-ehnq.onrender.com/api';
      const response = await fetch(`${API_BASE_URL}/gps/buses/route/${encodeURIComponent(routeNumber)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Route buses response:', data);

      if (data.success && Array.isArray(data.data)) {
        const busesData: BusInfo[] = data.data.map((bus: any) => ({
          busId: bus.busId,
          driverId: bus.driverId,
          driverName: bus.driverName || 'Unknown Driver',
          routeId: bus.routeId,
          isTracking: bus.isTracking || false,
          lastUpdate: bus.lastUpdate || new Date().toISOString(),
          currentLocation: bus.location?.coordinates ? {
            latitude: bus.location.coordinates[1],
            longitude: bus.location.coordinates[0],
          } : undefined,
          speed: bus.speed || 0,
          heading: bus.heading || 0,
        }));
        
        setBuses(busesData);
      } else {
        setBuses([]);
      }
    } catch (error) {
      console.error('Failed to load route buses:', error);
      setBuses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const handleBusClick = (bus: BusInfo) => {
    if (bus.isTracking && bus.currentLocation) {
      // Navigate to live tracking screen
      router.push(`/passenger/bus-tracking?busId=${bus.busId}&routeId=${bus.routeId}`);
    } else {
      alert('This bus is not currently being tracked');
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Route {routeNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {buses.length} bus{buses.length !== 1 ? 'es' : ''} available
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => loadRouteBuses(true)}
          disabled={refreshing}
        >
          <RefreshCw size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRouteBuses(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Route Info Header */}
        <View style={styles.routeInfoHeader}>
          <View style={styles.routeIconContainer}>
            <Navigation size={24} color={Colors.primary} />
          </View>
          <View style={styles.routeInfoText}>
            <Text style={styles.routeTitle}>Route {routeNumber}</Text>
            <Text style={styles.routeSubtitle}>
              {loading ? 'Loading...' : `${buses.length} active bus${buses.length !== 1 ? 'es' : ''}`}
            </Text>
          </View>
        </View>

        {/* Buses List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading buses...</Text>
          </View>
        ) : buses.length === 0 ? (
          <View style={styles.emptyState}>
            <Bus size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No buses available</Text>
            <Text style={styles.emptySubtitle}>
              No buses are currently active on this route
            </Text>
            <Button
              title="Refresh"
              onPress={() => loadRouteBuses()}
              style={styles.refreshEmptyButton}
            />
          </View>
        ) : (
          <View style={styles.busesList}>
            <Text style={styles.sectionTitle}>Available Buses</Text>
            {buses.map((bus, index) => (
              <TouchableOpacity
                key={`${bus.busId}-${index}`}
                style={styles.busCard}
                onPress={() => handleBusClick(bus)}
                activeOpacity={0.7}
              >
                <View style={styles.busCardHeader}>
                  <View style={styles.busIconContainer}>
                    <Bus size={24} color={Colors.white} />
                  </View>
                  <View style={styles.busCardInfo}>
                    <Text style={styles.busId}>Bus {bus.busId}</Text>
                    <Text style={styles.driverName}>{bus.driverName}</Text>
                  </View>
                  <View style={styles.trackingStatusContainer}>
                    {bus.isTracking ? (
                      <>
                        <View style={styles.liveIndicator}>
                          <Radio size={12} color={Colors.success} />
                        </View>
                        <Text style={styles.liveText}>LIVE</Text>
                      </>
                    ) : (
                      <Text style={styles.offlineText}>Offline</Text>
                    )}
                  </View>
                </View>

                <View style={styles.busCardDetails}>
                  <View style={styles.detailRow}>
                    <Clock size={14} color={Colors.text.secondary} />
                    <Text style={styles.detailText}>
                      Updated: {formatLastUpdate(bus.lastUpdate)}
                    </Text>
                  </View>
                  
                  {bus.isTracking && bus.currentLocation && (
                    <>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color={Colors.text.secondary} />
                        <Text style={styles.detailText}>
                          Location: {bus.currentLocation.latitude.toFixed(4)}, {bus.currentLocation.longitude.toFixed(4)}
                        </Text>
                      </View>
                      {bus.speed !== undefined && (
                        <View style={styles.detailRow}>
                          <Navigation size={14} color={Colors.text.secondary} />
                          <Text style={styles.detailText}>
                            Speed: {Math.round(bus.speed * 3.6)} km/h
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {bus.isTracking && (
                  <View style={styles.busCardFooter}>
                    <Text style={styles.tapToTrackText}>Tap to view live tracking →</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeInfoText: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  routeSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshEmptyButton: {
    marginTop: 12,
  },
  busesList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  busCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  busCardInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  trackingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.light,
  },
  liveIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  busCardDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  busCardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tapToTrackText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
});