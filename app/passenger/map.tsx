import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Layers, ZoomIn, ZoomOut, Navigation, LocateIcon, Bus } from 'lucide-react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Region, 
  MapPressEvent, 
  Polyline
} from '../../components/MapView';
import * as Location from 'expo-location';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface BusLocation {
  latitude: number;
  longitude: number;
}

interface BusRoute {
  id: string;
  coordinates: BusLocation[];
  color: string;
}

interface LiveBus {
  id: string;
  route: string;
  direction: string;
  title: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees
  status: 'active' | 'idle' | 'offline';
  routeId: string;
  nextStop: string;
  eta: string;
}

interface PinnedLocation {
  latitude: number;
  longitude: number;
}

// Mock bus routes with polyline coordinates
const busRoutes: BusRoute[] = [
  {
    id: 'route_138',
    color: Colors.primary,
    coordinates: [
      { latitude: 6.9271, longitude: 79.8612 },
      { latitude: 6.9300, longitude: 79.8650 },
      { latitude: 6.9350, longitude: 79.8700 },
      { latitude: 6.9400, longitude: 79.8750 },
      { latitude: 6.9450, longitude: 79.8800 },
    ]
  },
  {
    id: 'route_177',
    color: Colors.success,
    coordinates: [
      { latitude: 6.9344, longitude: 79.8428 },
      { latitude: 6.9300, longitude: 79.8400 },
      { latitude: 6.9250, longitude: 79.8350 },
      { latitude: 6.9200, longitude: 79.8300 },
      { latitude: 6.9150, longitude: 79.8250 },
    ]
  },
  {
    id: 'route_245',
    color: Colors.warning,
    coordinates: [
      { latitude: 6.9147, longitude: 79.8730 },
      { latitude: 6.9180, longitude: 79.8760 },
      { latitude: 6.9220, longitude: 79.8800 },
      { latitude: 6.9260, longitude: 79.8840 },
      { latitude: 6.9300, longitude: 79.8880 },
    ]
  }
];

export default function MapScreen() {
  const params = useLocalSearchParams();
  const mode = params.mode as string; // 'pin' or 'browse'
  const mapRef = useRef<MapView>(null);
  
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [isPinMode, setIsPinMode] = useState(mode === 'pin');
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation | null>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);

  // API configuration
  const API_BASE_URL = 'http://192.168.204.176:5000/api'; // Replace with your server URL

  // Default region (Colombo, Sri Lanka)
  const defaultRegion: Region = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const [region, setRegion] = useState<Region>(defaultRegion);

  // Fetch live bus data from API
  const fetchLiveBuses = async () => {
    try {
      setIsLoadingBuses(true);
      const response = await fetch(`${API_BASE_URL}/buses/live`);
      const data = await response.json();
      
      if (data.success && data.buses) {
        const buses: LiveBus[] = data.buses.map((bus: any) => ({
          id: bus.busId,
          route: bus.busId.split('_')[1] || 'Unknown', // Extract route from busId
          direction: getRouteDirection(bus.routeId),
          title: `Bus ${bus.busId.split('_')[1]} to ${getRouteDirection(bus.routeId)}`,
          latitude: bus.latitude,
          longitude: bus.longitude,
          speed: bus.speed || 0,
          heading: bus.heading || 0,
          status: bus.status || 'active',
          routeId: bus.routeId,
          nextStop: getNextStop(bus.routeId),
          eta: calculateETA(bus.latitude, bus.longitude, bus.speed),
        }));
        
        setLiveBuses(buses);
      }
    } catch (error) {
      console.error('Failed to fetch live buses:', error);
      // Fallback to mock data if API fails
      initializeMockBuses();
    } finally {
      setIsLoadingBuses(false);
    }
  };

  // Helper functions
  const getRouteDirection = (routeId: string): string => {
    const directions: { [key: string]: string } = {
      'route_138': 'Kandy',
      'route_177': 'Galle',
      'route_245': 'Negombo',
    };
    return directions[routeId] || 'Unknown';
  };

  const getNextStop = (routeId: string): string => {
    const nextStops: { [key: string]: string } = {
      'route_138': 'Pettah Central',
      'route_177': 'Mount Lavinia',
      'route_245': 'Kelaniya',
    };
    return nextStops[routeId] || 'Next Stop';
  };

  const calculateETA = (lat: number, lng: number, speed: number): string => {
    // Simple ETA calculation based on distance and speed
    // In real app, use proper route calculation
    const userLat = userLocation?.latitude || defaultRegion.latitude;
    const userLng = userLocation?.longitude || defaultRegion.longitude;
    
    const distance = calculateDistance(lat, lng, userLat, userLng);
    const timeInHours = distance / Math.max(speed, 10); // Minimum 10 km/h
    const timeInMinutes = Math.round(timeInHours * 60);
    
    return `${Math.max(1, timeInMinutes)} min`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize mock buses as fallback
  const initializeMockBuses = () => {
    const mockBuses: LiveBus[] = [
      {
        id: 'bus_138_01',
        route: '138',
        direction: 'Kandy',
        title: 'Bus 138 to Kandy',
        latitude: 6.9271,
        longitude: 79.8612,
        speed: 35,
        heading: 45,
        status: 'active',
        routeId: 'route_138',
        nextStop: 'Pettah Central',
        eta: '5 min'
      },
      {
        id: 'bus_177_01',
        route: '177',
        direction: 'Galle',
        title: 'Bus 177 to Galle',
        latitude: 6.9344,
        longitude: 79.8428,
        speed: 28,
        heading: 180,
        status: 'active',
        routeId: 'route_177',
        nextStop: 'Mount Lavinia',
        eta: '8 min'
      },
      {
        id: 'bus_245_01',
        route: '245',
        direction: 'Negombo',
        title: 'Bus 245 to Negombo',
        latitude: 6.9147,
        longitude: 79.8730,
        speed: 42,
        heading: 315,
        status: 'active',
        routeId: 'route_245',
        nextStop: 'Kelaniya',
        eta: '12 min'
      }
    ];
    
    setLiveBuses(mockBuses);
  };

  // Initialize and fetch live buses
  useEffect(() => {
    fetchLiveBuses();
  }, []);

  // Auto-refresh live bus data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPinMode) {
        fetchLiveBuses();
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isPinMode]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your current location on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setUserLocation(newRegion);
      setRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    if (isPinMode) {
      const coordinate = event.nativeEvent.coordinate;
      setPinnedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
    }
  };

  const handlePinDestination = () => {
    if (pinnedLocation) {
      // Mock address lookup - in real app, use reverse geocoding
      const mockAddress = `Location at ${pinnedLocation.latitude.toFixed(4)}, ${pinnedLocation.longitude.toFixed(4)}`;
      router.push(`/passenger/routes-buses?destination=${encodeURIComponent(mockAddress)}`);
    } else {
      Alert.alert('No Location Selected', 'Please tap on the map to select a destination');
    }
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleMyLocation = () => {
    if (locationPermission && userLocation) {
      if (mapRef.current) {
        mapRef.current.animateToRegion(userLocation, 1000);
      }
    } else {
      requestLocationPermission();
    }
  };

  const handleBusMarkerPress = (bus: LiveBus) => {
    // Show bus info and navigate to tracking
    Alert.alert(
      `Bus ${bus.route}`,
      `Direction: ${bus.direction}\nNext Stop: ${bus.nextStop}\nETA: ${bus.eta}\nSpeed: ${bus.speed.toFixed(0)} km/h`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Track Bus', 
          onPress: () => router.push(`/passenger/bus-tracking?busId=${bus.id}`)
        }
      ]
    );
  };

  const toggleRouteDisplay = () => {
    setShowRoutes(!showRoutes);
  };

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'idle': return Colors.warning;
      case 'offline': return Colors.gray[400];
      default: return Colors.primary;
    }
  };

  const renderBusIcon = (bus: LiveBus) => {
    return (
      <View style={[styles.busIconContainer, { 
        transform: [{ rotate: `${bus.heading}deg` }] 
      }]}>
        <View style={[styles.busIcon, { 
          backgroundColor: getBusStatusColor(bus.status),
          borderColor: Colors.white 
        }]}>
          <Bus size={16} color={Colors.white} />
        </View>
        <View style={styles.busRouteLabel}>
          <Text style={styles.busRouteLabelText}>{bus.route}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Google Maps */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        region={region}
        onPress={handleMapPress}
        onRegionChangeComplete={setRegion}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        showsTraffic={false}
      >
        {/* Bus Routes Polylines */}
        {showRoutes && !isPinMode && busRoutes.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.coordinates}
            strokeColor={route.color}
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        ))}

        {/* User Location Marker (if available) */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor={Colors.primary}
          />
        )}

        {/* Pinned Location Marker */}
        {pinnedLocation && (
          <Marker
            coordinate={pinnedLocation}
            title="Selected Location"
            description="Tap 'Pin Destination' to select this location"
            pinColor={Colors.danger}
          />
        )}

        {/* Live Bus Markers (only in browse mode) */}
        {!isPinMode && liveBuses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{
              latitude: bus.latitude,
              longitude: bus.longitude,
            }}
            title={bus.title}
            description={`${bus.direction} • Next: ${bus.nextStop} • ETA: ${bus.eta}`}
            onPress={() => handleBusMarkerPress(bus)}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            {renderBusIcon(bus)}
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Layers size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleMyLocation}>
          <LocateIcon size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Route Toggle Button */}
        {!isPinMode && (
          <TouchableOpacity 
            style={[styles.controlButton, showRoutes && styles.activeControlButton]} 
            onPress={toggleRouteDisplay}
          >
            <Navigation size={20} color={showRoutes ? Colors.white : Colors.primary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <ZoomIn size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <ZoomOut size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, isPinMode && styles.activeModeButton]}
          onPress={() => setIsPinMode(true)}
        >
          <MapPin size={16} color={isPinMode ? Colors.white : Colors.primary} />
          <Text style={[styles.modeButtonText, isPinMode && styles.activeModeButtonText]}>
            Pin Mode
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeButton, !isPinMode && styles.activeModeButton]}
          onPress={() => setIsPinMode(false)}
        >
          <Navigation size={16} color={!isPinMode ? Colors.white : Colors.primary} />
          <Text style={[styles.modeButtonText, !isPinMode && styles.activeModeButtonText]}>
            Browse Mode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pin Mode Instructions */}
      {isPinMode && !pinnedLocation && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsCard}>
            <MapPin size={24} color={Colors.primary} />
            <Text style={styles.instructionsText}>
              Tap anywhere on the map to drop a pin
            </Text>
          </View>
        </View>
      )}

      {/* Pinned Location Info */}
      {pinnedLocation && (
        <View style={styles.pinnedLocationInfo}>
          <View style={styles.pinnedLocationCard}>
            <MapPin size={20} color={Colors.danger} />
            <View style={styles.pinnedLocationText}>
              <Text style={styles.pinnedLocationTitle}>Selected Location</Text>
              <Text style={styles.pinnedLocationCoords}>
                {pinnedLocation.latitude.toFixed(4)}, {pinnedLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Button */}
      {isPinMode && pinnedLocation && (
        <View style={styles.actionContainer}>
          <Button
            title="Pin Destination"
            onPress={handlePinDestination}
            style={styles.actionButton}
          />
        </View>
      )}

      {/* Browse Mode Info */}
      {!isPinMode && (
        <View style={styles.browseInfo}>
          <View style={styles.browseInfoCard}>
            <View style={styles.busStatsRow}>
              <View style={styles.busStatItem}>
                <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.busStatText}>
                  {liveBuses.filter(b => b.status === 'active').length} Active
                </Text>
              </View>
              <View style={styles.busStatItem}>
                <View style={[styles.statusDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.busStatText}>
                  {liveBuses.filter(b => b.status === 'idle').length} Idle
                </Text>
              </View>
            </View>
            <Text style={styles.browseInfoSubtitle}>
              Tap on a bus to track it • Routes: {showRoutes ? 'Shown' : 'Hidden'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 8,
  },
  zoomControls: {
    gap: 4,
  },
  controlButton: {
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeControlButton: {
    backgroundColor: Colors.primary,
  },
  modeToggle: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: Colors.white,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  pinnedLocationInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  pinnedLocationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinnedLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  pinnedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  pinnedLocationCoords: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  browseInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  browseInfoCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  busStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  busStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  browseInfoSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Enhanced Bus Icon Styles
  busIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  busIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  busRouteLabel: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  busRouteLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  // Legacy styles (keeping for compatibility)
  busMarkerContainer: {
    alignItems: 'center',
  },
  busMarker: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  busMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
});