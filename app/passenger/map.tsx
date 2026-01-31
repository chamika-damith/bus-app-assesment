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
import { MapPin, Layers, ZoomIn, ZoomOut, Navigation, LocateIcon, Bus, Wifi, WifiOff } from 'lucide-react-native';
import { PlatformMapView as MapView, PlatformMarker as Marker, PROVIDER_GOOGLE } from '../../components/MapView';
import { Region, MapPressEvent, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import websocketService, { LocationUpdate, DriverStatusUpdate, ConnectionStatus } from '../../lib/services/websocket-service';

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
  lastUpdate: string;
  driverId?: string;
  accuracy?: number;
  isOnline?: boolean;
}

interface PinnedLocation {
  latitude: number;
  longitude: number;
}

// Bus routes with polyline coordinates
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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // API configuration
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bustracking-backend-ehnq.onrender.com/api';

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
      console.log('Fetching live buses from:', `${API_BASE_URL}/gps/buses/live`);
      
      const response = await fetch(`${API_BASE_URL}/gps/buses/live`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Live buses response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const buses: LiveBus[] = data.data
          .filter((busData: any) => {
            // Filter out buses without valid coordinates
            const lat = busData.latitude || busData.location?.coordinates?.[1] || busData.location?.latitude;
            const lng = busData.longitude || busData.location?.coordinates?.[0] || busData.location?.longitude;
            return lat !== undefined && lat !== 0 && lng !== undefined && lng !== 0;
          })
          .map((busData: any) => {
            // Handle both legacy and new data formats (including GeoJSON)
            const busId = busData.busId || busData.id || 'unknown';
            const routeId = busData.routeId || busData.route || 'unknown';
            const routeNumber = routeId.replace('route_', '').replace('Route-', '');
            
            // Extract coordinates from various formats
            let latitude = busData.latitude;
            let longitude = busData.longitude;
            
            // Check for GeoJSON format
            if (busData.location?.coordinates) {
              longitude = busData.location.coordinates[0];
              latitude = busData.location.coordinates[1];
            } else if (busData.location?.latitude) {
              latitude = busData.location.latitude;
              longitude = busData.location.longitude;
            }
            
            const timestamp = busData.timestamp || busData.lastUpdate || busData.lastSeen || Date.now();
            const timestampDate = new Date(timestamp).getTime();
            const isRecent = (Date.now() - timestampDate) < 120000; // Within 2 minutes
            const isOnline = busData.isOnline !== undefined ? busData.isOnline : isRecent;
            
            const speed = busData.speed || 0;
            const heading = busData.heading || 0;
            
            return {
              id: busId,
              route: routeNumber,
              direction: getRouteDirection(routeId),
              title: `Bus ${routeNumber} - ${getRouteDirection(routeId)}`,
              latitude: latitude || 0,
              longitude: longitude || 0,
              speed: speed,
              heading: heading,
              status: busData.status || (isOnline ? 'active' : 'offline'),
              routeId: routeId,
              nextStop: getNextStop(routeId),
              eta: calculateETA(latitude || 0, longitude || 0, speed),
              lastUpdate: new Date(timestamp).toISOString(),
              driverId: busData.driverId,
              accuracy: busData.accuracy || 0,
              isOnline: isOnline,
            };
          });
        
        console.log(`Loaded ${buses.length} active buses`);
        setLiveBuses(buses);
        setLastUpdateTime(new Date());
      } else {
        console.warn('No bus data in response');
        setLiveBuses([]);
      }
    } catch (error) {
      console.error('Failed to fetch live buses:', error);
      setLiveBuses([]);
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



  // Initialize WebSocket connection and event listeners
  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = [];

    const initializeWebSocket = async () => {
      try {
        // Set up event listeners
        const unsubscribeLocationUpdate = websocketService.onLocationUpdate((update: LocationUpdate) => {
          handleLocationUpdate(update);
        });

        const unsubscribeStatusUpdate = websocketService.onStatusUpdate((update: DriverStatusUpdate) => {
          handleDriverStatusUpdate(update);
        });

        const unsubscribeConnectionStatus = websocketService.onConnectionStatusChange((status: ConnectionStatus) => {
          setConnectionStatus(status);
          console.log('WebSocket connection status:', status);
        });

        const unsubscribeInitialLocations = websocketService.onInitialLocations((locations: LocationUpdate[]) => {
          handleInitialLocations(locations);
        });

        const unsubscribeError = websocketService.onError((error: string) => {
          console.error('WebSocket error:', error);
          // Fallback to API polling on WebSocket errors
          if (!isPinMode) {
            fetchLiveBuses();
          }
        });

        unsubscribeFunctions = [
          unsubscribeLocationUpdate,
          unsubscribeStatusUpdate,
          unsubscribeConnectionStatus,
          unsubscribeInitialLocations,
          unsubscribeError
        ];

        // Connect to WebSocket server
        await websocketService.connect();
        
        // Subscribe to map area updates
        if (!isPinMode) {
          subscribeToMapArea();
        }

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        // Fallback to API polling
        fetchLiveBuses();
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      websocketService.disconnect();
    };
  }, []);

  // Subscribe to map area when region changes (for real-time updates)
  useEffect(() => {
    if (!isPinMode && websocketService.isConnected()) {
      subscribeToMapArea();
    }
  }, [region, isPinMode]);

  // Handle real-time location updates (requirement 4.3)
  const handleLocationUpdate = (update: LocationUpdate) => {
    setLastUpdateTime(new Date());
    
    setLiveBuses(prevBuses => {
      const updatedBuses = [...prevBuses];
      const existingIndex = updatedBuses.findIndex(bus => bus.id === update.busId);
      
      if (existingIndex >= 0) {
        // Update existing bus
        const existingBus = updatedBuses[existingIndex];
        updatedBuses[existingIndex] = {
          ...existingBus,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed,
          heading: update.heading,
          status: update.status,
          lastUpdate: update.timestamp,
          accuracy: update.accuracy,
          isOnline: update.status !== 'offline',
          eta: calculateETA(update.latitude, update.longitude, update.speed)
        };
      } else {
        // Add new bus
        const newBus: LiveBus = {
          id: update.busId,
          route: update.busId.split('_')[1] || 'Unknown',
          direction: getRouteDirection(update.routeId),
          title: `Bus ${update.busId.split('_')[1] || 'Unknown'} to ${getRouteDirection(update.routeId)}`,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed,
          heading: update.heading,
          status: update.status,
          routeId: update.routeId,
          nextStop: getNextStop(update.routeId),
          eta: calculateETA(update.latitude, update.longitude, update.speed),
          lastUpdate: update.timestamp,
          driverId: update.driverId,
          accuracy: update.accuracy,
          isOnline: update.status !== 'offline'
        };
        updatedBuses.push(newBus);
      }
      
      return updatedBuses;
    });
  };

  // Handle driver status updates
  const handleDriverStatusUpdate = (update: DriverStatusUpdate) => {
    setLiveBuses(prevBuses => {
      return prevBuses.map(bus => {
        if (bus.id === update.busId) {
          return {
            ...bus,
            status: update.status,
            isOnline: update.status !== 'offline',
            lastUpdate: update.timestamp
          };
        }
        return bus;
      });
    });
  };

  // Handle initial locations from WebSocket
  const handleInitialLocations = (locations: LocationUpdate[]) => {
    const buses: LiveBus[] = locations.map(location => ({
      id: location.busId,
      route: location.busId.split('_')[1] || 'Unknown',
      direction: getRouteDirection(location.routeId),
      title: `Bus ${location.busId.split('_')[1] || 'Unknown'} to ${getRouteDirection(location.routeId)}`,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      status: location.status,
      routeId: location.routeId,
      nextStop: getNextStop(location.routeId),
      eta: calculateETA(location.latitude, location.longitude, location.speed),
      lastUpdate: location.timestamp,
      driverId: location.driverId,
      accuracy: location.accuracy,
      isOnline: location.status !== 'offline'
    }));
    
    setLiveBuses(buses);
    setLastUpdateTime(new Date());
  };

  // Subscribe to map area for location updates
  const subscribeToMapArea = () => {
    if (websocketService.isConnected()) {
      const bounds = {
        north: region.latitude + region.latitudeDelta / 2,
        south: region.latitude - region.latitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2
      };
      
      const areaId = `area_${Math.round(region.latitude * 1000)}_${Math.round(region.longitude * 1000)}`;
      websocketService.subscribeToArea(areaId, bounds);
    }
  };

  // Auto-refresh live bus data every 10 seconds
  useEffect(() => {
    if (isPinMode) return;
    
    const interval = setInterval(() => {
      fetchLiveBuses();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isPinMode]);

  useEffect(() => {
    requestLocationPermission();
    // Initial fetch of live buses
    if (!isPinMode) {
      fetchLiveBuses();
    }
  }, []);

  // Fetch live buses when mode changes
  useEffect(() => {
    if (!isPinMode) {
      fetchLiveBuses();
    }
  }, [isPinMode]);

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
      // TODO: Use reverse geocoding API for real address lookup
      const locationAddress = `Location at ${pinnedLocation.latitude.toFixed(4)}, ${pinnedLocation.longitude.toFixed(4)}`;
      router.push(`/passenger/routes-buses?destination=${encodeURIComponent(locationAddress)}`);
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
    // Enhanced bus info display with comprehensive information (Requirement 4.2, 4.4)
    const lastUpdateTime = bus.lastUpdate ? new Date(bus.lastUpdate).toLocaleTimeString() : 'Unknown';
    const accuracyText = bus.accuracy ? `±${bus.accuracy}m` : 'Unknown';
    const onlineStatus = bus.isOnline !== false ? 'Online' : 'Offline';
    
    let statusMessage = '';
    if (bus.status === 'offline' || bus.isOnline === false) {
      statusMessage = `Status: Offline\nLast seen: ${lastUpdateTime}`;
    } else {
      statusMessage = `Status: ${onlineStatus}\nSpeed: ${bus.speed.toFixed(0)} km/h\nAccuracy: ${accuracyText}\nLast update: ${lastUpdateTime}`;
    }

    Alert.alert(
      `Bus ${bus.route} - ${bus.direction}`,
      `${statusMessage}\nNext Stop: ${bus.nextStop}\nETA: ${bus.eta}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Track Bus', 
          onPress: () => router.push(`/passenger/bus-tracking?busId=${bus.id}&routeId=${bus.routeId}`),
          style: bus.status === 'offline' || bus.isOnline === false ? 'default' : 'default'
        }
      ]
    );
  };

  const toggleRouteDisplay = () => {
    setShowRoutes(!showRoutes);
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Updates';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Offline Mode';
      case 'error': return 'Connection Error';
      default: return 'Unknown Status';
    }
  };

  const getBusStatusColor = (status: string, isOnline?: boolean) => {
    // Handle offline bus display scenarios (Requirement 4.5)
    if (status === 'offline' || isOnline === false) {
      return Colors.bus.offline;
    }
    
    switch (status) {
      case 'active': return Colors.bus.active;
      case 'idle': return Colors.bus.idle;
      default: return Colors.primary;
    }
  };

  const renderBusIcon = (bus: LiveBus) => {
    const isOffline = bus.status === 'offline' || bus.isOnline === false;
    const statusColor = getBusStatusColor(bus.status, bus.isOnline);
    
    return (
      <View style={[styles.busIconContainer, { 
        transform: [{ rotate: `${bus.heading}deg` }],
        opacity: isOffline ? 0.6 : 1.0 // Visual indication for offline buses
      }]}>
        <View style={[styles.busIcon, { 
          backgroundColor: statusColor,
          borderColor: Colors.white,
          borderWidth: isOffline ? 1 : 2 // Thinner border for offline buses
        }]}>
          <Bus size={16} color={Colors.white} />
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>!</Text>
            </View>
          )}
        </View>
        <View style={[styles.busRouteLabel, {
          backgroundColor: isOffline ? Colors.gray[200] : Colors.white,
          borderColor: isOffline ? Colors.gray[400] : Colors.border
        }]}>
          <Text style={[styles.busRouteLabelText, {
            color: isOffline ? Colors.text.secondary : Colors.text.primary
          }]}>
            {bus.route}
          </Text>
        </View>
        {isOffline && (
          <View style={styles.offlineLabel}>
            <Text style={styles.offlineLabelText}>OFFLINE</Text>
          </View>
        )}
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
        {!isPinMode && liveBuses.map((bus) => {
          const isOffline = bus.status === 'offline' || bus.isOnline === false;
          return (
            <Marker
              key={bus.id}
              coordinate={{
                latitude: bus.latitude,
                longitude: bus.longitude,
              }}
              title={bus.title}
              description={`${bus.direction} • Next: ${bus.nextStop} • ETA: ${bus.eta} • Status: ${isOffline ? 'Offline' : 'Online'}`}
              onPress={() => handleBusMarkerPress(bus)}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              opacity={isOffline ? 0.7 : 1.0} // Reduced opacity for offline buses
            >
              {renderBusIcon(bus)}
            </Marker>
          );
        })}
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

        {/* Connection Status Indicator */}
        {!isPinMode && (
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              connectionStatus === 'connected' ? styles.connectedButton : styles.disconnectedButton
            ]}
            onPress={() => {
              if (connectionStatus !== 'connected') {
                websocketService.connect().catch(console.error);
              }
            }}
          >
            {connectionStatus === 'connected' ? (
              <Wifi size={20} color={Colors.white} />
            ) : (
              <WifiOff size={20} color={Colors.white} />
            )}
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
                <View style={[styles.statusDot, { backgroundColor: Colors.bus.active }]} />
                <Text style={styles.busStatText}>
                  {liveBuses.filter(b => b.status === 'active' && b.isOnline !== false).length} Active
                </Text>
              </View>
              <View style={styles.busStatItem}>
                <View style={[styles.statusDot, { backgroundColor: Colors.bus.idle }]} />
                <Text style={styles.busStatText}>
                  {liveBuses.filter(b => b.status === 'idle' && b.isOnline !== false).length} Idle
                </Text>
              </View>
              <View style={styles.busStatItem}>
                <View style={[styles.statusDot, { backgroundColor: Colors.bus.offline }]} />
                <Text style={styles.busStatText}>
                  {liveBuses.filter(b => b.status === 'offline' || b.isOnline === false).length} Offline
                </Text>
              </View>
            </View>
            <View style={styles.infoFooter}>
              <Text style={styles.browseInfoSubtitle}>
                Tap on a bus to track it • {liveBuses.length} buses visible
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchLiveBuses}
                disabled={isLoadingBuses}
              >
                <Text style={styles.refreshButtonText}>
                  {isLoadingBuses ? '⟳' : '↻'}
                </Text>
              </TouchableOpacity>
            </View>
            {lastUpdateTime && (
              <Text style={styles.lastUpdateText}>
                Last update: {lastUpdateTime.toLocaleTimeString()}
              </Text>
            )}
            {liveBuses.length === 0 && !isLoadingBuses && (
              <Text style={styles.noBusesText}>
                No active buses found. Pull to refresh.
              </Text>
            )}
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
  connectedButton: {
    backgroundColor: Colors.success,
  },
  disconnectedButton: {
    backgroundColor: Colors.danger,
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
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  lastUpdateText: {
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noBusesText: {
    fontSize: 12,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
  // Offline bus indicators
  offlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.white,
  },
  offlineLabel: {
    backgroundColor: Colors.danger,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  offlineLabelText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.white,
  },
  loadingText: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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