import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// Web fallback for MapView - shows a placeholder
export default function MapView({ children, ...props }: any) {
  return (
    <View style={[styles.webMapContainer, props.style]}>
      <Text style={styles.webMapText}>
        🗺️ Map View
      </Text>
      <Text style={styles.webMapSubtext}>
        (Maps are not available on web - use mobile app)
      </Text>
      {children}
    </View>
  );
}

export function Marker({ children, ...props }: any) {
  return (
    <View style={styles.markerContainer}>
      <Text style={styles.markerText}>📍</Text>
      {children}
    </View>
  );
}

export function Polyline(props: any) {
  return null; // Not rendered on web
}

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  markerContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  markerText: {
    fontSize: 20,
  },
});