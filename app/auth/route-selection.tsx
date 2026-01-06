import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Search, MapPin, Clock, Navigation } from 'lucide-react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface Route {
  id: string;
  number: string;
  name: string;
  stops_count: number;
  distance: string;
  operating_hours: string;
  description: string;
}

export default function RouteSelection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const { updateUser } = useAuth();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);
      // Load routes from backend
      // For now, show empty state
      setRoutes([]);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmRoute = async () => {
    if (!selectedRoute) {
      Alert.alert('Error', 'Please select a route to continue');
      return;
    }

    const route = routes.find(r => r.id === selectedRoute);
    if (!route) return;

    setLoading(true);
    try {
      await updateUser({ 
        assignedRoute: `${route.number} - ${route.name}` 
      });
      
      Alert.alert(
        'Route Confirmed',
        `You are now assigned to Route ${route.number}. Location tracking will start automatically when you begin your shift.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/driver')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to assign route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRouteData = routes.find(r => r.id === selectedRoute);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Route</Text>
          <Text style={styles.subtitle}>
            Choose the bus route you'll be driving
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.gray[400]} />
            <Input
              placeholder="Search by route number or name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchInput}
            />
          </View>
        </View>

        {/* Route List */}
        <View style={styles.routesList}>
          {filteredRoutes.map((route) => {
            const isSelected = selectedRoute === route.id;
            
            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  isSelected && styles.selectedRouteCard
                ]}
                onPress={() => setSelectedRoute(route.id)}
              >
                <View style={styles.routeHeader}>
                  <View style={[
                    styles.routeNumber,
                    isSelected && styles.selectedRouteNumber
                  ]}>
                    <Text style={[
                      styles.routeNumberText,
                      isSelected && styles.selectedRouteNumberText
                    ]}>
                      {route.number}
                    </Text>
                  </View>
                  
                  <View style={styles.routeInfo}>
                    <Text style={[
                      styles.routeName,
                      isSelected && styles.selectedRouteName
                    ]}>
                      {route.name}
                    </Text>
                    <Text style={[
                      styles.routeDescription,
                      isSelected && styles.selectedRouteDescription
                    ]}>
                      {route.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.detailItem}>
                    <MapPin size={16} color={isSelected ? Colors.white : Colors.gray[400]} />
                    <Text style={[
                      styles.detailText,
                      isSelected && styles.selectedDetailText
                    ]}>
                      {route.stops_count} stops
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Navigation size={16} color={isSelected ? Colors.white : Colors.gray[400]} />
                    <Text style={[
                      styles.detailText,
                      isSelected && styles.selectedDetailText
                    ]}>
                      {route.distance}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Clock size={16} color={isSelected ? Colors.white : Colors.gray[400]} />
                    <Text style={[
                      styles.detailText,
                      isSelected && styles.selectedDetailText
                    ]}>
                      {route.operating_hours}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Route Preview */}
        {selectedRouteData && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Route Preview</Text>
            <View style={styles.mapPreview}>
              <Text style={styles.mapPlaceholder}>
                🗺️ Map preview for Route {selectedRouteData.number}
              </Text>
              <Text style={styles.mapSubtext}>
                Detailed route map will be available in the driver dashboard
              </Text>
            </View>
          </View>
        )}

        <Button
          title="Confirm Route"
          onPress={handleConfirmRoute}
          loading={loading}
          disabled={!selectedRoute}
          style={styles.confirmButton}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 8,
  },
  routesList: {
    gap: 12,
    marginBottom: 20,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRouteCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeNumber: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedRouteNumber: {
    backgroundColor: Colors.white,
  },
  routeNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  selectedRouteNumberText: {
    color: Colors.primary,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  selectedRouteName: {
    color: Colors.white,
  },
  routeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  selectedRouteDescription: {
    color: Colors.white,
    opacity: 0.9,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  selectedDetailText: {
    color: Colors.white,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  mapPreview: {
    backgroundColor: Colors.light,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapPlaceholder: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});