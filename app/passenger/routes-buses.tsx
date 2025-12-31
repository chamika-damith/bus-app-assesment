import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface BusStop {
  id: string;
  name: string;
  destination: string;
  eta: string;
  status: 'On time' | 'Delayed' | 'Cancelled';
  crowdLevel?: 'low' | 'medium' | 'high';
}

export default function BusStopPage() {
  const params = useLocalSearchParams();
  const destination = params.destination as string || 'Bus Routes';
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = getAPIClient();

  useEffect(() => {
    loadBusStops();
  }, []);

  const loadBusStops = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading bus stops from backend...');
      const liveBuses = await apiClient.getLiveBuses();
      
      // Transform live buses into bus stop format
      const busStopData: BusStop[] = liveBuses.map((bus, index) => ({
        id: bus.busId,
        name: bus.routeId,
        destination: `${bus.routeId} Terminal`,
        eta: `${Math.floor(Math.random() * 30) + 5} min`,
        status: ['On time', 'Delayed', 'On time', 'On time'][index % 4] as 'On time' | 'Delayed' | 'Cancelled',
      }));

      setBusStops(busStopData);
      console.log('Loaded bus stops:', busStopData.length);
      
    } catch (err) {
      console.error('Error loading bus stops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bus stops';
      setError(errorMessage);
      
      // Fallback to demo data
      setBusStops([
        {
          id: 'demo',
          name: '⚠️ Demo',
          destination: 'Backend Connection Failed',
          eta: 'N/A',
          status: 'Cancelled'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On time': return Colors.success;
      case 'Delayed': return Colors.warning;
      case 'Cancelled': return Colors.danger;
      default: return Colors.gray[400];
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'On time': return styles.onTimeStatus;
      case 'Delayed': return styles.delayedStatus;
      case 'Cancelled': return styles.cancelledStatus;
      default: return styles.defaultStatus;
    }
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
        <Text style={styles.headerTitle}>{destination}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bus routes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Bus Stop List */}
          <View style={styles.busStopList}>
            <View style={styles.listHeader}>
              <Text style={styles.columnHeader}>Bus</Text>
              <Text style={styles.columnHeader}>Destination</Text>
              <Text style={styles.columnHeader}>ETA</Text>
              <Text style={styles.columnHeader}>Status</Text>
            </View>

            {busStops.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No buses available</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later or try refreshing
                </Text>
              </View>
            ) : (
              busStops.map((busStop) => (
                <TouchableOpacity 
                  key={busStop.id} 
                  style={styles.busStopRow}
                  onPress={() => router.push(`/passenger/bus-tracking?busId=${busStop.id}`)}
                >
                  <View style={styles.busNumberContainer}>
                    <Text style={styles.busNumber}>{busStop.name}</Text>
                  </View>
                  
                  <View style={styles.destinationContainer}>
                    <Text style={styles.destinationText}>{busStop.destination}</Text>
                  </View>
                  
                  <View style={styles.etaContainer}>
                    <Text style={styles.etaText}>{busStop.eta}</Text>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, getStatusStyle(busStop.status)]}>
                      <Text style={[styles.statusText, { color: getStatusColor(busStop.status) }]}>
                        {busStop.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Map Section */}
          <View style={styles.mapSection}>
            <TouchableOpacity 
              style={styles.mapContainer}
              onPress={() => router.push('/passenger/map')}
            >
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapIcon}>🗺️</Text>
                <Text style={styles.mapText}>View on Map</Text>
              </View>
            </TouchableOpacity>

            {/* Map Images Grid */}
            <View style={styles.mapImagesGrid}>
              <TouchableOpacity style={styles.mapImageCard}>
                <View style={styles.mapImagePlaceholder}>
                  <Text style={styles.mapImageText}>📍 Stop Location</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mapImageCard}>
                <View style={styles.mapImagePlaceholder}>
                  <Text style={styles.mapImageText}>🚌 Live Buses</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mapImageCard}>
                <View style={styles.mapImagePlaceholder}>
                  <Text style={styles.mapImageText}>🛣️ Route View</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mapImageCard}>
                <View style={styles.mapImagePlaceholder}>
                  <Text style={styles.mapImageText}>📊 Traffic Info</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.showRouteButton}>
              <Text style={styles.showRouteText}>Show a route</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  busStopList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  columnHeader: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  busStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  busNumberContainer: {
    flex: 1,
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  destinationContainer: {
    flex: 1,
    alignItems: 'center',
  },
  destinationText: {
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  etaContainer: {
    flex: 1,
    alignItems: 'center',
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  onTimeStatus: {
    backgroundColor: '#E8F5E8',
  },
  delayedStatus: {
    backgroundColor: '#FFF3E0',
  },
  cancelledStatus: {
    backgroundColor: '#FFEBEE',
  },
  defaultStatus: {
    backgroundColor: Colors.background.secondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapSection: {
    marginBottom: 20,
  },
  mapContainer: {
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
  mapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  mapImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mapImageCard: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: Colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mapImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: 8,
  },
  mapImageText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  showRouteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  showRouteText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});