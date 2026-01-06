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
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Home, Briefcase, Heart, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  type: 'home' | 'work' | 'favorite' | 'custom';
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function SavedPlaces() {
  const { user } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPlaces();
  }, []);

  const loadSavedPlaces = async () => {
    try {
      setLoading(true);
      // Load from user profile or backend
      const userPlaces = user?.savedPlaces || [];
      setSavedPlaces(userPlaces);
    } catch (error) {
      console.error('Failed to load saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home size={20} color={Colors.primary} />;
      case 'work':
        return <Briefcase size={20} color={Colors.primary} />;
      case 'favorite':
        return <Heart size={20} color={Colors.primary} />;
      default:
        return <MapPin size={20} color={Colors.primary} />;
    }
  };

  const handlePlacePress = (place: SavedPlace) => {
    // Navigate to routes for this destination
    router.push(`/passenger/routes-buses?destination=${encodeURIComponent(place.name)}`);
  };

  const handleEditPlace = (place: SavedPlace) => {
    Alert.alert(
      'Edit Place',
      `Edit ${place.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Name', onPress: () => editPlaceName(place) },
        { text: 'Change Location', onPress: () => changeLocation(place) }
      ]
    );
  };

  const editPlaceName = (place: SavedPlace) => {
    Alert.prompt(
      'Edit Name',
      'Enter new name for this place',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              setSavedPlaces(places => 
                places.map(p => 
                  p.id === place.id ? { ...p, name: newName.trim() } : p
                )
              );
            }
          }
        }
      ],
      'plain-text',
      place.name
    );
  };

  const changeLocation = (place: SavedPlace) => {
    Alert.alert(
      'Change Location',
      'This will open the map to select a new location',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Map', 
          onPress: () => {
            router.push(`/passenger/map?mode=pin&editPlace=${place.id}`);
          }
        }
      ]
    );
  };

  const handleDeletePlace = (place: SavedPlace) => {
    Alert.alert(
      'Delete Place',
      `Are you sure you want to delete "${place.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setSavedPlaces(places => places.filter(p => p.id !== place.id));
          }
        }
      ]
    );
  };

  const handleAddPlace = () => {
    Alert.alert(
      'Add New Place',
      'How would you like to add a new place?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Search Address', 
          onPress: () => router.push('/passenger/search?mode=save')
        },
        { 
          text: 'Pick on Map', 
          onPress: () => router.push('/passenger/map?mode=pin&action=save')
        }
      ]
    );
  };

  const showPlaceOptions = (place: SavedPlace) => {
    Alert.alert(
      place.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Find Routes', onPress: () => handlePlacePress(place) },
        { text: 'Edit', onPress: () => handleEditPlace(place) },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeletePlace(place) 
        }
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Saved Places</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add New Place Button */}
        <TouchableOpacity style={styles.addPlaceButton} onPress={handleAddPlace}>
          <Plus size={24} color={Colors.primary} />
          <Text style={styles.addPlaceText}>Add New Place</Text>
        </TouchableOpacity>

        {/* Saved Places List */}
        <View style={styles.placesList}>
          {savedPlaces.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No saved places</Text>
              <Text style={styles.emptySubtitle}>
                Add your favorite locations for quick access
              </Text>
            </View>
          ) : (
            savedPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => handlePlacePress(place)}
              >
                <View style={styles.placeInfo}>
                  <View style={styles.placeIcon}>
                    {getPlaceIcon(place.type)}
                  </View>
                  <View style={styles.placeDetails}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress}>{place.address}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.optionsButton}
                  onPress={() => showPlaceOptions(place)}
                >
                  <MoreVertical size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>About Saved Places</Text>
          <Text style={styles.helpText}>
            Save your frequently visited locations for quick route planning. 
            Tap on any saved place to find bus routes to that destination.
          </Text>
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
  headerRight: {
    width: 32, // Balance the header
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addPlaceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  placesList: {
    marginBottom: 30,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  optionsButton: {
    padding: 8,
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
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});