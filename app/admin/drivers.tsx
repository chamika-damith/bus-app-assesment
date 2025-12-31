import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  User, 
  Phone, 
  Bus, 
  MapPin, 
  Wifi, 
  WifiOff,
  Edit,
  Trash2,
  Clock
} from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api';

interface Driver {
  driverId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  busId: string;
  routeId: string;
  isActive: boolean;
  lastSeen: number;
  hasCurrentLocation: boolean;
}

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    busId: '',
    routeId: '',
  });

  const apiClient = getAPIClient();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('Fetching drivers from backend...');
      const backendDrivers = await apiClient.getDrivers();
      
      // Transform backend driver data to match our interface
      const transformedDrivers: Driver[] = backendDrivers.map(driver => ({
        driverId: driver.id || driver.driverId,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        busId: driver.busId,
        routeId: driver.routeId,
        isActive: driver.isActive,
        lastSeen: driver.lastSeen,
        hasCurrentLocation: !!driver.location,
      }));

      setDrivers(transformedDrivers);
      console.log('Loaded drivers:', transformedDrivers.length);
      
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to connect to server';
      setError(errorMessage);
      
      // Show demo data with error indicator
      setDrivers([
        {
          driverId: 'demo1',
          name: '⚠️ Backend Connection Failed',
          phone: 'Check server status',
          licenseNumber: 'N/A',
          busId: 'N/A',
          routeId: 'N/A',
          isActive: false,
          lastSeen: Date.now(),
          hasCurrentLocation: false,
        }
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchDrivers(true);
  };

  const addDriver = async () => {
    try {
      if (!newDriver.name || !newDriver.phone || !newDriver.licenseNumber || 
          !newDriver.busId || !newDriver.routeId) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }

      setIsLoading(true);
      
      const driverRegistration = {
        name: newDriver.name,
        phone: newDriver.phone,
        licenseNumber: newDriver.licenseNumber,
        busId: newDriver.busId,
        routeId: newDriver.routeId,
        deviceId: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      const response = await apiClient.registerDriver(driverRegistration);
      
      if (response.success) {
        Alert.alert(
          'Driver Added',
          `Driver registered successfully!\n\nDriver ID: ${response.data?.driverId}\nDevice ID: ${driverRegistration.deviceId}\n\nShare these details with the driver.`,
          [{ text: 'OK', onPress: () => {
            setShowAddModal(false);
            setNewDriver({ name: '', phone: '', licenseNumber: '', busId: '', routeId: '' });
            fetchDrivers();
          }}]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to add driver');
      }
    } catch (error) {
      console.error('Failed to add driver:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add driver';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDriver = async (driverId: string, driverName: string) => {
    Alert.alert(
      'Remove Driver',
      `Are you sure you want to remove ${driverName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeDriver(driverId);
              Alert.alert('Success', 'Driver removed successfully');
              fetchDrivers();
            } catch (error) {
              console.error('Failed to remove driver:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to remove driver';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (driver: Driver) => {
    if (!driver.isActive) return Colors.gray[400];
    
    const now = Date.now();
    const timeSinceLastSeen = now - driver.lastSeen;
    
    if (timeSinceLastSeen < 60000) return Colors.success; // Less than 1 minute
    if (timeSinceLastSeen < 300000) return Colors.warning; // Less than 5 minutes
    return Colors.danger; // More than 5 minutes
  };

  const getStatusText = (driver: Driver) => {
    if (!driver.isActive) return 'Offline';
    
    const now = Date.now();
    const timeSinceLastSeen = now - driver.lastSeen;
    
    if (timeSinceLastSeen < 60000) return 'Online';
    if (timeSinceLastSeen < 300000) return 'Idle';
    return 'Lost Connection';
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderDriverCard = (driver: Driver) => (
    <View key={driver.driverId} style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <User size={20} color={Colors.text.primary} />
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(driver) }]} />
          </View>
          <View style={styles.driverDetails}>
            <View style={styles.detailRow}>
              <Phone size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>{driver.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Bus size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>Bus {driver.busId} • Route {driver.routeId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color={Colors.text.secondary} />
              <Text style={styles.detailText}>Last seen: {formatLastSeen(driver.lastSeen)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.driverActions}>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(driver) }]}>
              {getStatusText(driver)}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Navigate to driver details/edit
                Alert.alert('Edit Driver', 'Edit functionality coming soon');
              }}
            >
              <Edit size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => removeDriver(driver.driverId, driver.name)}
            >
              <Trash2 size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {driver.hasCurrentLocation && (
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => {
            // Navigate to driver location on map
            Alert.alert('View Location', 'Map view coming soon');
          }}
        >
          <MapPin size={16} color={Colors.primary} />
          <Text style={styles.locationButtonText}>View on Map</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drivers Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{drivers.length}</Text>
          <Text style={styles.statLabel}>Total Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{drivers.filter(d => d.isActive).length}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{drivers.filter(d => d.hasCurrentLocation).length}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
      </View>

      {/* Drivers List */}
      <ScrollView 
        style={styles.driversList}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchDrivers} />
        }
      >
        {drivers.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>No Drivers Registered</Text>
            <Text style={styles.emptySubtitle}>
              Add your first driver to start GPS tracking
            </Text>
            <Button
              title="Add Driver"
              onPress={() => setShowAddModal(true)}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          drivers.map(renderDriverCard)
        )}
      </ScrollView>

      {/* Add Driver Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Driver</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Input
                label="Driver Name"
                value={newDriver.name}
                onChangeText={(text) => setNewDriver(prev => ({ ...prev, name: text }))}
                placeholder="Enter driver's full name"
              />
              
              <Input
                label="Phone Number"
                value={newDriver.phone}
                onChangeText={(text) => setNewDriver(prev => ({ ...prev, phone: text }))}
                placeholder="+94771234567"
                keyboardType="phone-pad"
              />
              
              <Input
                label="License Number"
                value={newDriver.licenseNumber}
                onChangeText={(text) => setNewDriver(prev => ({ ...prev, licenseNumber: text }))}
                placeholder="DL001234"
              />
              
              <Input
                label="Bus ID"
                value={newDriver.busId}
                onChangeText={(text) => setNewDriver(prev => ({ ...prev, busId: text }))}
                placeholder="bus_138_01"
              />
              
              <Input
                label="Route ID"
                value={newDriver.routeId}
                onChangeText={(text) => setNewDriver(prev => ({ ...prev, routeId: text }))}
                placeholder="route_138"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Add Driver"
                onPress={addDriver}
                style={styles.modalAddButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  driversList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  driverCard: {
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
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  driverDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  driverActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
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
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalForm: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalAddButton: {
    width: '100%',
  },
});