import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Bus,
  MapPin,
  Clock,
  LogOut,
  Edit3,
  Shield,
  Settings,
  Star,
  Calendar,
  Navigation,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DriverSession {
  driverId: string;
  sessionId: string;
  busId: string;
  routeId: string;
  isOnline: boolean;
}

interface DriverDetails {
  driverId: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  busId: string;
  routeId: string;
  isActive: boolean;
  lastSeen: number;
  sessionStartTime?: number;
  sessionExpiresAt?: number;
}

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const apiClient = getAPIClient();

  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    try {
      setIsLoading(true);
      
      // Load session data
      const savedSession = await AsyncStorage.getItem('@driver_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        
        // Get detailed driver information from backend
        try {
          const statusResponse = await apiClient.getDriverStatus(parsedSession.driverId);
          if (statusResponse.success) {
            // Get all drivers to find detailed info
            const driversResponse = await apiClient.getDrivers();
            const currentDriver = driversResponse.find(d => d.driverId === parsedSession.driverId);
            
            if (currentDriver) {
              setDriverDetails({
                driverId: currentDriver.driverId,
                name: currentDriver.name,
                phone: currentDriver.phone,
                licenseNumber: currentDriver.licenseNumber,
                busId: currentDriver.busId,
                routeId: currentDriver.routeId,
                isActive: statusResponse.data.isOnline,
                lastSeen: statusResponse.data.lastSeen,
              });
            }
          }
        } catch (error) {
          console.error('Failed to load driver details:', error);
          // Use session data as fallback
          setDriverDetails({
            driverId: parsedSession.driverId,
            name: user?.name || 'Driver',
            phone: user?.phone || 'N/A',
            licenseNumber: 'N/A',
            busId: parsedSession.busId,
            routeId: parsedSession.routeId,
            isActive: parsedSession.isOnline,
            lastSeen: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to load driver profile:', error);
      Alert.alert('Error', 'Failed to load profile information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? This will stop GPS tracking and end your current session.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      if (session?.sessionId) {
        // End session on backend
        try {
          await apiClient.logoutDriver(session.sessionId);
        } catch (error) {
          console.error('Failed to end session on backend:', error);
          // Continue with local logout even if backend fails
        }
      }
      
      // Clear local session data
      await AsyncStorage.removeItem('@driver_session');
      await AsyncStorage.removeItem('@device_id');
      
      // Logout from auth context
      await logout();
      
      // Navigate to login screen
      router.replace('/auth/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout properly. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatLastSeen = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatSessionDuration = (startTime?: number): string => {
    if (!startTime) return 'N/A';
    const duration = Date.now() - startTime;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.white} />
          </View>
          <Text style={styles.driverName}>{driverDetails?.name || user?.name || 'Driver'}</Text>
          <Text style={styles.driverStatus}>
            {driverDetails?.isActive ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>

        {/* Driver Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User size={20} color={Colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Driver ID</Text>
                <Text style={styles.infoValue}>{driverDetails?.driverId || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Phone size={20} color={Colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{driverDetails?.phone || 'N/A'}</Text>
              </View>
            </View>

            {user?.email && (
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.gray[600]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <CreditCard size={20} color={Colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>License Number</Text>
                <Text style={styles.infoValue}>{driverDetails?.licenseNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bus Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bus Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Bus size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Bus ID</Text>
                <Text style={styles.infoValue}>{driverDetails?.busId || session?.busId || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Navigation size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Route ID</Text>
                <Text style={styles.infoValue}>{driverDetails?.routeId || session?.routeId || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={20} color={Colors.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[
                  styles.infoValue,
                  { color: driverDetails?.isActive ? Colors.success : Colors.danger }
                ]}>
                  {driverDetails?.isActive ? 'Active & Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={20} color={Colors.gray[600]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Seen</Text>
                <Text style={styles.infoValue}>
                  {driverDetails?.lastSeen ? formatLastSeen(driverDetails.lastSeen) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Session Information */}
        {session && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Session</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Shield size={20} color={Colors.warning} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Session ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {session.sessionId}
                  </Text>
                </View>
              </View>

              {driverDetails?.sessionStartTime && (
                <View style={styles.infoRow}>
                  <Calendar size={20} color={Colors.gray[600]} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Session Duration</Text>
                    <Text style={styles.infoValue}>
                      {formatSessionDuration(driverDetails.sessionStartTime)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <Star size={20} color={Colors.warning} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>GPS Tracking</Text>
                  <Text style={styles.infoValue}>
                    {session.isOnline ? 'Active' : 'Paused'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/driver/gps-tracker')}>
            <Settings size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>GPS Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={loadDriverProfile}>
            <Edit3 size={20} color={Colors.gray[600]} />
            <Text style={styles.actionButtonText}>Refresh Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title={isLoggingOut ? 'Logging out...' : 'Logout'}
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            icon={isLoggingOut ? undefined : <LogOut size={20} color={Colors.white} />}
          />
        </View>
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  driverStatus: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutSection: {
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
});