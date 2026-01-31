import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function SimplePassengerScreen() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const routes = [
    { id: '1', name: 'Route 138', destination: 'Colombo - Kandy' },
    { id: '2', name: 'Route 177', destination: 'Colombo - Galle' },
    { id: '3', name: 'Route 245', destination: 'Colombo - Negombo' },
  ];

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route.id);
    Alert.alert(
      'Route Selected',
      `You selected ${route.name} (${route.destination})`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => router.replace('/auth/simple')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Passenger Dashboard</Text>
        <Text style={styles.subtitle}>Find your bus</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Routes</Text>
          
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                selectedRoute === route.id && styles.selectedRoute
              ]}
              onPress={() => handleRouteSelect(route)}
            >
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeDestination}>{route.destination}</Text>
              </View>
              <View style={styles.routeStatus}>
                <Text style={styles.statusText}>Active</Text>
                <View style={styles.statusDot} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>View Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Nearby Buses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionText}>Bus Schedule</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    padding: 20,
    backgroundColor: Colors.secondary,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedRoute: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  routeDestination: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: Colors.success,
    marginRight: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});