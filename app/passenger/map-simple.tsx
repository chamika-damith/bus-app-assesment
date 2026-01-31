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

export default function SimpleMapScreen() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const routes = [
    { id: '1', name: 'Route 138', status: 'Active', buses: 3 },
    { id: '2', name: 'Route 177', status: 'Active', buses: 2 },
    { id: '3', name: 'Route 245', status: 'Limited', buses: 1 },
  ];

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route.id);
    Alert.alert(
      'Route Selected',
      `Showing buses for ${route.name}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bus Map</Text>
        <Text style={styles.subtitle}>Find buses near you</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Interactive Map</Text>
          <Text style={styles.mapSubtext}>
            Map view available in full version
          </Text>
        </View>

        <View style={styles.routesSection}>
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
                <Text style={styles.routeStatus}>
                  {route.status} • {route.buses} buses
                </Text>
              </View>
              <View style={styles.routeIndicator}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: route.status === 'Active' ? Colors.success : Colors.warning }
                ]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Find Nearest Stop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionText}>Check Schedule</Text>
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
  mapPlaceholder: {
    backgroundColor: Colors.white,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  routesSection: {
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
  routeStatus: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routeIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
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
});