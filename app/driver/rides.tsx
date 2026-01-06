import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Clock, User, Phone } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';

interface RideRequest {
  id: string;
  passenger: {
    name: string;
    rating: number;
    phone: string;
  };
  pickup: {
    address: string;
    time: string;
  };
  dropoff: {
    address: string;
  };
  distance: string;
  duration: string;
  fare: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
}

export default function DriverRides() {
  const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'completed'>('requests');
  const rideRequests: RideRequest[] = [];

  const filteredRides = rideRequests.filter(ride => {
    switch (activeTab) {
      case 'requests':
        return ride.status === 'pending';
      case 'active':
        return ride.status === 'accepted' || ride.status === 'in_progress';
      case 'completed':
        return ride.status === 'completed';
      default:
        return false;
    }
  });

  const handleAcceptRide = (rideId: string) => {
    console.log('Accepting ride:', rideId);
    // Handle ride acceptance logic
  };

  const handleDeclineRide = (rideId: string) => {
    console.log('Declining ride:', rideId);
    // Handle ride decline logic
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rides</Text>
        
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredRides.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No {activeTab} rides</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'requests' 
                ? 'New ride requests will appear here'
                : activeTab === 'active'
                ? 'Your active rides will show here'
                : 'Completed rides will be listed here'
              }
            </Text>
          </View>
        ) : (
          filteredRides.map((ride) => (
            <View key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View style={styles.passengerInfo}>
                  <User size={20} color={Colors.primary} />
                  <Text style={styles.passengerName}>{ride.passenger.name}</Text>
                  <Text style={styles.passengerRating}>★ {ride.passenger.rating}</Text>
                </View>
                <Text style={styles.fare}>${ride.fare.toFixed(2)}</Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <MapPin size={16} color={Colors.success} />
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeAddress}>{ride.pickup.address}</Text>
                    <Text style={styles.routeTime}>Pickup at {ride.pickup.time}</Text>
                  </View>
                </View>
                
                <View style={styles.routeLine} />
                
                <View style={styles.routePoint}>
                  <MapPin size={16} color={Colors.danger} />
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeAddress}>{ride.dropoff.address}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripInfo}>
                <View style={styles.tripDetail}>
                  <Clock size={16} color={Colors.gray[400]} />
                  <Text style={styles.tripDetailText}>{ride.duration}</Text>
                </View>
                <View style={styles.tripDetail}>
                  <MapPin size={16} color={Colors.gray[400]} />
                  <Text style={styles.tripDetailText}>{ride.distance}</Text>
                </View>
                <TouchableOpacity style={styles.tripDetail}>
                  <Phone size={16} color={Colors.primary} />
                  <Text style={[styles.tripDetailText, { color: Colors.primary }]}>
                    Call
                  </Text>
                </TouchableOpacity>
              </View>

              {ride.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <Button
                    title="Decline"
                    variant="outline"
                    onPress={() => handleDeclineRide(ride.id)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Accept"
                    onPress={() => handleAcceptRide(ride.id)}
                    style={styles.actionButton}
                  />
                </View>
              )}

              {ride.status === 'accepted' && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Ride Accepted - Navigate to pickup</Text>
                  <Button
                    title="Start Trip"
                    size="small"
                    style={styles.statusButton}
                    onPress={() => {
                      // TODO: Implement start trip functionality
                      console.log('Start trip for ride:', ride.id);
                    }}
                  />
                </View>
              )}
            </View>
          ))
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.text.primary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  rideCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  passengerRating: {
    fontSize: 14,
    color: Colors.warning,
    marginLeft: 8,
  },
  fare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeDetails: {
    marginLeft: 8,
    flex: 1,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  routeTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[200],
    marginLeft: 7,
    marginBottom: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDetailText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  statusButton: {
    minWidth: 100,
  },
});