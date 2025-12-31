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
import { Search, Bell, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface Trip {
  id: string;
  route: string;
  from: string;
  to: string;
  price: string;
  status: string;
}

interface Route {
  id: string;
  route: string;
  destination: string;
  from: string;
  to: string;
  price: string;
  nextArrival: string;
  status: string;
}

export default function PassengerHome() {
  const { user } = useAuth();
  const isSimpleMode = user?.uiMode === 'SIMPLE';
  const [loading, setLoading] = useState(true);
  const [lastTrips, setLastTrips] = useState<Trip[]>([]);
  const [favouriteRoutes, setFavouriteRoutes] = useState<Route[]>([]);
  const [balanceInfo, setBalanceInfo] = useState({
    balance: 'Rs.0',
    passId: 'Loading...'
  });

  const apiClient = getAPIClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // In a real app, these would come from backend APIs
      // For now, we'll load from live bus data to show real integration
      const liveBuses = await apiClient.getLiveBuses();
      
      // Generate realistic data based on current user and live buses
      const userBalance = {
        balance: 'Rs.' + (Math.floor(Math.random() * 1000) + 100),
        passId: user?.id?.slice(-8) || '00000000'
      };
      
      // Generate recent trips based on available routes
      const recentTrips: Trip[] = liveBuses.slice(0, 2).map((bus, index) => ({
        id: `trip_${index + 1}`,
        route: bus.routeId,
        from: `From ${bus.routeId} Start`,
        to: `To ${bus.routeId} End`,
        price: `Rs.${Math.floor(Math.random() * 100) + 50}`,
        status: 'completed'
      }));

      // Generate favorite routes based on available routes
      const favoriteRoutes: Route[] = liveBuses.slice(0, 2).map((bus, index) => ({
        id: `fav_${index + 1}`,
        route: bus.routeId,
        destination: `${bus.routeId} Destination`,
        from: `From ${bus.routeId} Start`,
        to: `To ${bus.routeId} End`,
        price: `Rs.${Math.floor(Math.random() * 200) + 100}.00`,
        nextArrival: `Today / ${String(9 + index * 5).padStart(2, '0')}:00`,
        status: 'Next arrival'
      }));

      setBalanceInfo(userBalance);
      setLastTrips(recentTrips);
      setFavouriteRoutes(favoriteRoutes);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to minimal data
      setBalanceInfo({
        balance: 'Rs.0',
        passId: user?.id?.slice(-8) || '00000000'
      });
      setLastTrips([]);
      setFavouriteRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSimpleMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {user?.name}! 👋</Text>
            <Text style={styles.subtitle}>Where would you like to go?</Text>
          </View>

          {/* Large Search Bar */}
          <TouchableOpacity 
            style={styles.largeSearchBar}
            onPress={() => router.push('/passenger/search')}
          >
            <Search size={24} color={Colors.gray[400]} />
            <Text style={styles.searchPlaceholder}>Search destinations...</Text>
          </TouchableOpacity>

          {/* Large Action Buttons */}
          <View style={styles.largeActions}>
            <Button
              title="Find on Map"
              onPress={() => router.push('/passenger/map?mode=pin')}
              style={styles.largeButton}
            />
            <Button
              title="My Location"
              onPress={() => router.push('/passenger/nearby-buses')}
              variant="outline"
              style={styles.largeButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Modern Mode - Matching Sample UI
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with greeting and notification */}
        <View style={styles.modernHeader}>
          <View>
            <Text style={styles.universityText}>TransLink Bus System</Text>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Hey, {user?.name || 'User'}</Text>
              <TouchableOpacity style={styles.notificationButton}>
                <Bell size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.passId}>Pass Id</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balanceInfo.balance}</Text>
            <Text style={styles.passIdNumber}>{balanceInfo.passId}</Text>
          </View>
          <TouchableOpacity style={styles.addPassButton}>
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addPassText}>Add new pass</Text>
          </TouchableOpacity>
        </View>

        {/* Your last trips */}
        {lastTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your last trips</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tripsRow}>
              {lastTrips.map((trip) => (
                <TouchableOpacity key={trip.id} style={styles.tripCard}>
                  <View style={styles.routeNumberBadge}>
                    <Text style={styles.routeNumber}>{trip.route}</Text>
                  </View>
                  <Text style={styles.tripRoute}>{trip.from}</Text>
                  <Text style={styles.tripRoute}>{trip.to}</Text>
                  <Text style={styles.tripPrice}>{trip.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Favourite route */}
        {favouriteRoutes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Favourite route</Text>
              <View style={styles.tabButtons}>
                <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
                  <Text style={[styles.tabText, styles.activeTabText]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton}>
                  <Text style={styles.tabText}>Bus</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton}>
                  <Text style={styles.tabText}>Train</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.favouriteRoutes}>
              {favouriteRoutes.map((route) => (
                <TouchableOpacity key={route.id} style={styles.routeCard}>
                  <View style={styles.routeCardHeader}>
                    <View style={styles.routeNumberBadge}>
                      <Text style={styles.routeNumber}>{route.route}</Text>
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeDestination}>{route.destination}</Text>
                      <Text style={styles.routeDetails}>{route.from}</Text>
                      <Text style={styles.routeDetails}>{route.to}</Text>
                    </View>
                    <View style={styles.routePricing}>
                      <Text style={styles.routePrice}>{route.price}</Text>
                      <Text style={styles.nextArrival}>{route.nextArrival}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addRouteButton}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addRouteText}>Add new route</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state when no data */}
        {lastTrips.length === 0 && favouriteRoutes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Welcome to TransLink!</Text>
            <Text style={styles.emptySubtitle}>
              Start by finding nearby buses or exploring routes
            </Text>
            <Button
              title="Find Nearby Buses"
              onPress={() => router.push('/passenger/nearby-buses')}
              style={styles.emptyButton}
            />
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
    marginBottom: 30,
  },
  modernHeader: {
    marginBottom: 24,
  },
  universityText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  notificationButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  passId: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  passIdNumber: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
  addPassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addPassText: {
    fontSize: 14,
    color: Colors.white,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Trips
  tripsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tripCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeNumberBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  tripRoute: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 4,
  },
  // Tab Buttons
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text.primary,
  },
  // Favourite Routes
  favouriteRoutes: {
    gap: 12,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  routeDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  routePricing: {
    alignItems: 'flex-end',
  },
  routePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  nextArrival: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addRouteText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  // Simple Mode Styles (keeping existing)
  largeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeActions: {
    gap: 16,
    marginBottom: 30,
  },
  largeButton: {
    minHeight: 60,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.gray[400],
    marginLeft: 12,
    flex: 1,
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});