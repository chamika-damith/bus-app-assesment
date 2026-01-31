import React, { forwardRef } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// Platform-specific imports
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  // Only import react-native-maps on mobile platforms
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

interface MapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  provider?: any;
  mapType?: 'standard' | 'satellite';
  onPress?: (event: any) => void;
  onRegionChangeComplete?: (region: any) => void;
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
}

// Web fallback component
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion, children }) => {
  return (
    <View style={[styles.webMapContainer, style]}>
      <View style={styles.webMapContent}>
        <Text style={styles.webMapTitle}>Map View</Text>
        <Text style={styles.webMapCoords}>
          📍 {initialRegion.latitude.toFixed(4)}, {initialRegion.longitude.toFixed(4)}
        </Text>
        <Text style={styles.webMapNote}>
          Interactive map available on mobile app
        </Text>
        {children}
      </View>
    </View>
  );
};

const WebMarker: React.FC<MarkerProps> = ({ coordinate, title, description, pinColor }) => {
  return (
    <View style={styles.webMarker}>
      <View style={[styles.webMarkerPin, { backgroundColor: pinColor || Colors.primary }]} />
      <Text style={styles.webMarkerTitle}>{title}</Text>
      {description && <Text style={styles.webMarkerDescription}>{description}</Text>}
    </View>
  );
};

// Export platform-specific components
export const PlatformMapView = forwardRef<any, MapViewProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  }
  
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      {...props}
    />
  );
});

export const PlatformMarker: React.FC<MarkerProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMarker {...props} />;
  }
  
  return <Marker {...props} />;
};

// Export as default for backward compatibility
export default PlatformMapView;

// Export the native components and constants for direct use
export { MapView as NativeMapView, Marker as NativeMarker, PROVIDER_GOOGLE };

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webMapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  webMapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  webMapCoords: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  webMapNote: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  webMarker: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webMarkerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  webMarkerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  webMarkerDescription: {
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});