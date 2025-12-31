import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { User, Search, Filter, MoreVertical, Users, UserCheck, UserX, RefreshCw } from 'lucide-react-native';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastActive: string;
  totalRides?: number;
  rating?: number;
  phone?: string;
  driverId?: string;
  busId?: string;
  routeId?: string;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'PASSENGER' | 'DRIVER' | 'ADMIN'>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = getAPIClient();

  useEffect(() => {
    loadUsersAndDrivers();
  }, []);

  const loadUsersAndDrivers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Loading users and drivers from backend...');
      
      // Load both regular users and drivers from the backend
      const [usersResponse, driversResponse] = await Promise.allSettled([
        apiClient.getUsers(),
        apiClient.getDrivers(),
      ]);

      const loadedUsers: UserData[] = [];

      // Process regular users
      if (usersResponse.status === 'fulfilled') {
        console.log('Loaded users:', usersResponse.value.length);
        const backendUsers = usersResponse.value;
        backendUsers.forEach(user => {
          loadedUsers.push({
            id: user.id,
            name: user.name,
            email: user.email || 'N/A',
            phone: user.phone,
            role: 'PASSENGER', // Backend users are passengers by default
            status: 'active', // Assume active for now
            joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
            lastActive: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
          });
        });
      } else {
        console.warn('Failed to load users:', usersResponse.reason);
      }

      // Process drivers
      if (driversResponse.status === 'fulfilled') {
        console.log('Loaded drivers:', driversResponse.value.length);
        const backendDrivers = driversResponse.value;
        
        backendDrivers.forEach(driver => {
          loadedUsers.push({
            id: driver.id || driver.driverId,
            name: driver.name,
            email: 'N/A', // Drivers don't have email in the current system
            phone: driver.phone,
            role: 'DRIVER',
            status: driver.isActive ? 'active' : 'inactive',
            joinDate: 'Unknown', // Driver registration date not available
            lastActive: driver.lastSeen ? new Date(driver.lastSeen).toLocaleString() : 'Never',
            driverId: driver.driverId || driver.id,
            busId: driver.busId,
            routeId: driver.routeId,
          });
        });
      } else {
        console.warn('Failed to load drivers:', driversResponse.reason);
      }

      // Handle complete failure
      if (usersResponse.status === 'rejected' && driversResponse.status === 'rejected') {
        throw new Error('Failed to connect to backend. Please check if the server is running.');
      }

      setUsers(loadedUsers);
      console.log('Total users loaded:', loadedUsers.length);

    } catch (err) {
      console.error('Error loading users and drivers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data from backend';
      setError(errorMessage);
      
      // Show demo data with error indicator
      setUsers([
        {
          id: 'demo1',
          name: '⚠️ Backend Connection Failed',
          email: 'Check server status',
          role: 'ADMIN',
          status: 'suspended',
          joinDate: 'N/A',
          lastActive: 'Error loading data',
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadUsersAndDrivers(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.phone && user.phone.includes(searchQuery));
    const matchesFilter = activeFilter === 'all' || user.role === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: UserData['status']) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'inactive':
        return Colors.warning;
      case 'suspended':
        return Colors.danger;
      default:
        return Colors.gray[400];
    }
  };

  const getRoleColor = (role: UserData['role']) => {
    switch (role) {
      case 'ADMIN':
        return Colors.danger;
      case 'DRIVER':
        return Colors.primary;
      case 'PASSENGER':
        return Colors.secondary;
      default:
        return Colors.gray[400];
    }
  };

  const filters = [
    { key: 'all', label: 'All Users' },
    { key: 'PASSENGER', label: 'Passengers' },
    { key: 'DRIVER', label: 'Drivers' },
    { key: 'ADMIN', label: 'Admins' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading users from backend...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw 
            size={20} 
            color={Colors.primary} 
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.gray[400]} />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchInput}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredUsers.length}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredUsers.filter(u => u.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredUsers.filter(u => u.role === 'DRIVER').length}
            </Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userAvatar}>
                <User size={24} color={Colors.white} />
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.phone && (
                  <Text style={styles.userPhone}>📱 {user.phone}</Text>
                )}
                {user.busId && (
                  <Text style={styles.userBus}>🚌 Bus: {user.busId}</Text>
                )}
              </View>

              <View style={styles.userMeta}>
                <View style={[styles.roleTag, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleText}>{user.role}</Text>
                </View>
                
                <View style={[styles.statusTag, { backgroundColor: getStatusColor(user.status) }]}>
                  <Text style={styles.statusText}>{user.status}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.menuButton}>
                <MoreVertical size={20} color={Colors.gray[400]} />
              </TouchableOpacity>
            </View>

            <View style={styles.userDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>{user.joinDate}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Active:</Text>
                <Text style={styles.detailValue}>{user.lastActive}</Text>
              </View>

              {user.totalRides && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Rides:</Text>
                  <Text style={styles.detailValue}>{user.totalRides}</Text>
                </View>
              )}

              {user.rating && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rating:</Text>
                  <Text style={styles.detailValue}>⭐ {user.rating}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {filteredUsers.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Users size={48} color={Colors.gray[400]} />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'No users match the current filter'}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  refreshButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    padding: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
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
  filterContainer: {
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: Colors.danger + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  userBus: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  userMeta: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  menuButton: {
    padding: 4,
  },
  userDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});