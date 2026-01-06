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
import { ArrowLeft, Clock, MapPin, X } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface BusStop {
  id: string;
  name: string;
  time: string;
  status: 'current' | 'next' | 'future' | 'passed';
}

export default function RouteDetails() {
  const params = useLocalSearchParams();
  const routeId = params.routeId as string;
  const routeNumber = params.routeNumber as string || routeId;
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouteDetails();
  }, [routeId]);

  const loadRouteDetails = async () => {
    try {
      setLoading(true);
      // In a real app, fetch route details from backend
      // For now, show message that data needs to be loaded
      setBusStops([]);
    } catch (error) {
      console.error('Failed to load route details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStopStatusStyle = (status: string) => {
    switch (status) {
      case 'current':
        return styles.currentStop;
      case 'next':
        return styles.nextStop;
      default:
        return styles.futureStop;
    }
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return Colors.primary;
      case 'next':
        return Colors.warning;
      default:
        return Colors.gray[400];
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
        <Text style={styles.headerTitle}>{routeNumber}</Text>
        <TouchableOpacity style={styles.closeButton}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Route Info Header */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : busStops.length > 0 ? (
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeTitle}>{routeNumber} Bus Route</Text>
            <Text style={styles.routeSubtitle}>{busStops.length} stops</Text>
          </View>
        ) : (
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeTitle}>{routeNumber} Bus Route</Text>
            <Text style={styles.routeSubtitle}>No route data available</Text>
          </View>
        )}

        {/* Bus Stops Timeline */}
        <View style={styles.timelineContainer}>
          {busStops.map((stop, index) => (
            <View key={stop.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: getStopStatusColor(stop.status) }
                ]} />
                {index < busStops.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              
              <TouchableOpacity 
                style={[styles.stopCard, getStopStatusStyle(stop.status)]}
                onPress={() => {
                  // Handle stop selection or show more details
                }}
              >
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                </View>
                
                {stop.status === 'current' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
                
                {stop.status === 'next' && (
                  <View style={styles.nextBadge}>
                    <Text style={styles.nextBadgeText}>Delayed</Text>
                  </View>
                )}
                
                {stop.status === 'future' && (
                  <View style={styles.futureBadge}>
                    <Text style={styles.futureBadgeText}>On time</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <Button
          title="View in real time"
          onPress={() => router.push(`/passenger/bus-tracking?routeId=${routeId}`)}
          style={styles.actionButton}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  routeInfoHeader: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  timelineContainer: {
    marginBottom: 30,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
  },
  stopCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentStop: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  nextStop: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  futureStop: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.gray[200],
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  nextBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  futureBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  futureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButton: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});