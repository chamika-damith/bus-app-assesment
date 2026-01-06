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
import { router } from 'expo-router';
import { Search, Mic, Clock, MapPin, Star, Navigation } from 'lucide-react-native';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface RouteInfo {
  routeId: string;
  busId: string;
  driverId: string;
  driverName: string;
  isActive: boolean;
}

const categories = [
  { id: 'schools', name: 'Schools', icon: '🏫' },
  { id: 'hospitals', name: 'Hospitals', icon: '🏥' },
  { id: 'shopping', name: 'Shopping', icon: '🛒' },
  { id: 'transport', name: 'Transport Hubs', icon: '🚉' },
];

export default function DestinationSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches] = useState<string[]>([]);
  const apiClient = getAPIClient();

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [searchQuery, routes]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      // Fetch all registered drivers (not just live/active ones)
      const drivers = await apiClient.getDrivers();
      
      // Filter only online/active drivers
      const onlineDrivers = drivers.filter(driver => driver.isOnline || driver.isActive);
      
      // Extract unique routes from online drivers
      const routeMap = new Map<string, RouteInfo>();
      onlineDrivers.forEach(driver => {
        const routeId = driver.routeId || driver.route || 'Unknown Route';
        if (!routeMap.has(routeId)) {
          routeMap.set(routeId, {
            routeId: routeId,
            busId: driver.busId || driver.vehicleNumber || 'N/A',
            driverId: driver.driverId || driver._id || driver.id,
            driverName: driver.name,
            isActive: driver.isActive || driver.isOnline || false,
          });
        }
      });
      
      const routeList = Array.from(routeMap.values());
      setRoutes(routeList);
      setFilteredRoutes(routeList);
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([]);
      setFilteredRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRoutes = () => {
    if (!searchQuery.trim()) {
      setFilteredRoutes(routes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = routes.filter(route => 
      route.routeId.toLowerCase().includes(query) ||
      route.driverName.toLowerCase().includes(query) ||
      route.busId.toLowerCase().includes(query)
    );
    setFilteredRoutes(filtered);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
    }
  };

  const handleRouteClick = (route: RouteInfo) => {
    router.push(`/passenger/route-details?routeNumber=${encodeURIComponent(route.routeId)}`);
  };

  const handleVoiceSearch = () => {
    // TODO: Implement voice search with speech recognition API
    console.log('Voice search activated');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Where to?</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.gray[400]} />
            <Input
              placeholder="Search destinations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              containerStyle={styles.searchInput}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={handleVoiceSearch}
            >
              <Mic size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Bus Routes</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading routes...</Text>
            </View>
          ) : filteredRoutes.length === 0 ? (
            <View style={styles.emptyState}>
              <Navigation size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>No routes available</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'No active buses at the moment'}
              </Text>
            </View>
          ) : (
            filteredRoutes.map((route, index) => (
              <TouchableOpacity
                key={index}
                style={styles.routeCard}
                onPress={() => handleRouteClick(route)}
              >
                <View style={styles.routeIcon}>
                  <Navigation size={20} color={Colors.primary} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeNumber}>{route.routeId}</Text>
                  <Text style={styles.routeDriver}>Driver: {route.driverName}</Text>
                  <View style={styles.routeStatus}>
                    <View style={[styles.statusDot, route.isActive && styles.statusDotActive]} />
                    <Text style={[styles.statusLabel, route.isActive && styles.statusLabelActive]}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <MapPin size={20} color={Colors.gray[400]} />
              </TouchableOpacity>
            ))
          )}
        </View>
        
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.listItem}
                onPress={() => handleSearch(search)}
              >
                <Clock size={16} color={Colors.gray[400]} />
                <Text style={styles.listItemText}>{search}</Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  searchContainer: {
    marginBottom: 30,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 8,
  },
  voiceButton: {
    padding: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '22%',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategory: {
    borderColor: Colors.primary,
    backgroundColor: Colors.light,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  destinationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  routeDriver: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[400],
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  statusLabelActive: {
    color: Colors.success,
    fontWeight: '500',
  },
});