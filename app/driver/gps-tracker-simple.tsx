import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';

export default function SimpleGPSTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
  });

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    Alert.alert(
      'GPS Tracking',
      `GPS tracking is now ${!isTracking ? 'enabled' : 'disabled'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Tracker</Text>
        <Text style={styles.subtitle}>Track your bus location</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Tracking Status</Text>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isTracking ? Colors.success : Colors.error }
            ]} />
            <Text style={styles.statusText}>
              {isTracking ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isTracking ? Colors.error : Colors.success }
            ]}
            onPress={toggleTracking}
          >
            <Text style={styles.toggleButtonText}>
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Current Location</Text>
          <Text style={styles.locationText}>
            Lat: {location.latitude.toFixed(4)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {location.longitude.toFixed(4)}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>GPS Information</Text>
          <Text style={styles.infoText}>
            • GPS tracking helps passengers find your bus
          </Text>
          <Text style={styles.infoText}>
            • Location is updated every 15 seconds when active
          </Text>
          <Text style={styles.infoText}>
            • Turn off when not driving to save battery
          </Text>
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
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});