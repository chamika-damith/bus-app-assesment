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
import { 
  Power, 
  DollarSign, 
  Clock, 
  Star, 
  Navigation,
  Users,
  TrendingUp 
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { getAPIClient } from '../../lib/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DriverSession {
  driverId: string;
  mongoId?: string;
  sessionId: string;
  busId: string;
  routeId: string;
  isOnline: boolean;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<DriverSession | null>(null);
  const apiClient = getAPIClient();

  useEffect(() => {
    loadDriverSession();
  }, []);

  const loadDriverSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem('@driver_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        setIsOnline(parsedSession.isOnline || false);
        
        // Sync status with backend
        if (parsedSession.driverId) {
          try {
            const statusResponse = await apiClient.getDriverStatus(parsedSession.driverId);
            if (statusResponse.success) {
              const backendIsOnline = statusResponse.data.isOnline;
              if (backendIsOnline !== parsedSession.isOnline) {
                // Update local session to match backend
                const updatedSession = { ...parsedSession, isOnline: backendIsOnline };
                setSession(updatedSession);
                setIsOnline(backendIsOnline);
                await AsyncStorage.setItem('@driver_session', JSON.stringify(updatedSession));
              }
            }
          } catch (error) {
            console.error('Failed to sync status with backend:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load driver session:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!session) {
      Alert.alert('Error', 'No active driver session found. Please restart the app.');
      return;
    }

    setIsLoading(true);
    try {
      const newOnlineStatus = !isOnline;
      
      // Update status on backend (pass mongoId if available)
      await apiClient.updateDriverStatus(
        session.driverId, 
        session.sessionId, 
        newOnlineStatus,
        session.mongoId
      );
      
      // Update local state
      setIsOnline(newOnlineStatus);
      
      // Update stored session
      const updatedSession = { ...session, isOnline: newOnlineStatus };
      setSession(updatedSession);
      await AsyncStorage.setItem('@driver_session', JSON.stringify(updatedSession));
      
      Alert.alert(
        'Status Updated',
        `You are now ${newOnlineStatus ? 'online' : 'offline'}. ${
          newOnlineStatus 
            ? 'Passengers can see your location and request rides.' 
            : 'You will not receive ride requests.'
        }`
      );
      
    } catch (error) {
      console.error('Failed to update online status:', error);
      Alert.alert(
        'Update Failed', 
        'Failed to update your online status. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOnlineStatus = () => {
    toggleOnlineStatus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}! 👋</Text>
            <Text style={styles.subtitle}>Ready to start driving?</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusButton, isOnline && styles.statusButtonOnline]}
            onPress={handleToggleOnlineStatus}
            disabled={isLoading}
          >
            <Power size={20} color={isOnline ? Colors.white : Colors.gray[600]} />
            <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
              {isLoading ? 'Updating...' : (isOnline ? 'Online' : 'Offline')}
            </Text>
          </TouchableOpacity>
        </View>

        {isOnline && (
          <View style={styles.activeSection}>
            <Text style={styles.sectionTitle}>You're Online!</Text>
            <View style={styles.onlineCard}>
              <Users size={32} color={Colors.primary} />
              <Text style={styles.onlineTitle}>Looking for passengers...</Text>
              <Text style={styles.onlineSubtitle}>
                Stay in a busy area to get more ride requests
              </Text>
            </View>
          </View>
        )}

        {!isOnline && !isLoading && (
          <Button
            title="Go Online"
            onPress={handleToggleOnlineStatus}
            style={styles.goOnlineButton}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusButtonOnline: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
    marginLeft: 6,
  },
  statusTextOnline: {
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  activeSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  onlineCard: {
    backgroundColor: Colors.light,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  onlineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  onlineSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  recentRides: {
    marginBottom: 30,
  },
  rideCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  earnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  rideRoute: {
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rideRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  goOnlineButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});