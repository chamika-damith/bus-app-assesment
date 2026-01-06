import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Navigation, MapPin, Clock, ArrowRight } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';

interface GuidanceInfo {
  distanceToRoute: number;
  nearestStreet: string;
  walkingDirection: string;
  nextBusArrival: string;
  estimatedWalkTime: number;
}

export default function OffRouteGuidance() {
  const params = useLocalSearchParams();
  const busId = params.busId as string;
  const [loading, setLoading] = useState(true);
  const [guidanceInfo, setGuidanceInfo] = useState<GuidanceInfo | null>(null);

  useEffect(() => {
    calculateGuidance();
  }, [busId]);

  const calculateGuidance = async () => {
    try {
      setLoading(true);
      // Calculate real guidance based on user location and bus route
      // This would use geolocation and routing APIs
      setGuidanceInfo({
        distanceToRoute: 0,
        nearestStreet: 'Loading...',
        walkingDirection: 'Calculating...',
        nextBusArrival: 'N/A',
        estimatedWalkTime: 0,
      });
    } catch (error) {
      console.error('Failed to calculate guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async () => {
    if (!guidanceInfo) return;
    
    // Open Google Maps with walking directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${guidanceInfo.nearestStreet}&travelmode=walking`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open Google Maps');
      }
    } catch (error) {
      console.error('Error opening navigation:', error);
    }
  };

  const handleDismiss = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Navigation size={24} color={Colors.warning} />
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleDismiss}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>You are off the bus route</Text>
            <Text style={styles.subtitle}>
              Walk to the nearest bus road to catch your bus
            </Text>

            {/* Distance Info */}
            <View style={styles.distanceCard}>
              <View style={styles.distanceHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.distanceLabel}>Distance to bus route</Text>
              </View>
              <Text style={styles.distanceValue}>{guidanceInfo.distanceToRoute}m</Text>
              <Text style={styles.distanceSubtext}>
                Approximately {guidanceInfo.estimatedWalkTime} minute walk
              </Text>
            </View>

            {/* Direction Info */}
            <View style={styles.directionCard}>
              <View style={styles.directionHeader}>
                <Text style={styles.directionTitle}>Walk towards</Text>
                <View style={styles.directionArrow}>
                  <ArrowRight size={20} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.streetName}>{guidanceInfo.nearestStreet}</Text>
              <Text style={styles.directionText}>
                Head {guidanceInfo.walkingDirection} to reach the bus route
              </Text>
            </View>

            {/* Mini Map Placeholder */}
            <View style={styles.miniMap}>
              <View style={styles.miniMapContent}>
                <MapPin size={32} color={Colors.primary} />
                <Text style={styles.miniMapText}>Mini Map</Text>
                <Text style={styles.miniMapSubtext}>
                  Your location and nearest bus road
                </Text>
              </View>
            </View>

            {/* Next Bus Info */}
            <View style={styles.nextBusCard}>
              <View style={styles.nextBusHeader}>
                <Clock size={20} color={Colors.success} />
                <Text style={styles.nextBusLabel}>Next bus arrival</Text>
              </View>
              <Text style={styles.nextBusTime}>{guidanceInfo.nextBusArrival}</Text>
              <Text style={styles.nextBusSubtext}>
                From the nearest bus stop
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title="Navigate with Google Maps"
                onPress={handleNavigate}
                style={styles.navigateButton}
              />
              
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <Text style={styles.dismissText}>I'll find my way</Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text style={styles.helpText}>
              This guidance helps you get back on track to catch your bus
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  distanceCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  distanceSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  directionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  directionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directionTitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  directionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streetName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  directionText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  miniMap: {
    height: 120,
    backgroundColor: Colors.light,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  miniMapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMapText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
  },
  miniMapSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  nextBusCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nextBusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBusLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  nextBusTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 4,
  },
  nextBusSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  actionButtons: {
    marginBottom: 16,
  },
  navigateButton: {
    marginBottom: 12,
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});