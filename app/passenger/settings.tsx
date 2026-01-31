import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { 
  User, 
  Palette, 
  Globe, 
  Bell, 
  MapPin, 
  Ruler, 
  Trash2, 
  Info, 
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Bus,
  Navigation,
  Heart,
  Route,
  Users,
  AlertTriangle,
  Clock
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'navigation' | 'toggle' | 'selector' | 'action' | 'display';
  value?: string | boolean;
  options?: string[];
  route?: string;
  action?: () => void;
}

export default function MoreScreen() {
  const { user, logout, updateUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleUIMode = async (mode: 'SIMPLE' | 'MODERN') => {
    try {
      await updateUser({ uiMode: mode });
      Alert.alert('UI Mode Updated', `Switched to ${mode.toLowerCase()} mode`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update UI mode');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data including recent searches and saved routes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Implement cache clearing logic
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Features',
      items: [
        {
          id: 'active_buses',
          title: 'Active Buses',
          subtitle: 'View all live buses',
          icon: <Bus size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/active-buses'
        },
        {
          id: 'nearby_buses',
          title: 'Nearby Buses',
          subtitle: 'Find buses near your location',
          icon: <Navigation size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/nearby-buses'
        },
        {
          id: 'saved_places',
          title: 'Saved Places',
          subtitle: 'Manage your favorite locations',
          icon: <Heart size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/saved-places'
        },
        {
          id: 'route_details',
          title: 'Route Details',
          subtitle: 'Explore bus routes and schedules',
          icon: <Route size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/route-details'
        },
        {
          id: 'bus_tracking',
          title: 'Bus Tracking',
          subtitle: 'Track specific buses in real-time',
          icon: <Clock size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/bus-tracking'
        },
        {
          id: 'crowd_report',
          title: 'Crowd Report',
          subtitle: 'Report and view bus crowding',
          icon: <Users size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/crowd-report'
        },
        {
          id: 'off_route_guidance',
          title: 'Off-Route Guidance',
          subtitle: 'Get help when buses are off-route',
          icon: <AlertTriangle size={20} color={Colors.primary} />,
          type: 'navigation' as const,
          route: '/passenger/off-route-guidance'
        }
      ]
    },
    {
      title: 'Profile',
      items: [
        {
          id: 'profile',
          title: user?.name || 'User',
          subtitle: user?.email,
          icon: <User size={20} color={Colors.text.secondary} />,
          type: 'display' as const,
        }
      ]
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'ui_mode',
          title: 'UI Mode',
          subtitle: user?.uiMode === 'SIMPLE' ? 'Simple Mode' : 'Modern Mode',
          icon: <Palette size={20} color={Colors.text.secondary} />,
          type: 'selector' as const,
          options: ['Simple', 'Modern'],
          action: () => {
            Alert.alert(
              'Select UI Mode',
              'Choose your preferred interface style',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Simple Mode', 
                  onPress: () => handleUIMode('SIMPLE')
                },
                { 
                  text: 'Modern Mode', 
                  onPress: () => handleUIMode('MODERN')
                }
              ]
            );
          }
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English',
          icon: <Globe size={20} color={Colors.text.secondary} />,
          type: 'selector' as const,
          options: ['English', 'Sinhala', 'Tamil'],
          action: () => {
            Alert.alert(
              'Select Language',
              'Choose your preferred language',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'English', onPress: () => {} },
                { text: 'සිංහල', onPress: () => {} },
                { text: 'தமிழ்', onPress: () => {} }
              ]
            );
          }
        },
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Automatic based on system',
          icon: isDarkMode ? <Moon size={20} color={Colors.text.secondary} /> : <Sun size={20} color={Colors.text.secondary} />,
          type: 'toggle' as const,
          value: isDarkMode,
          action: () => setIsDarkMode(!isDarkMode)
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Bus arrival alerts and updates',
          icon: <Bell size={20} color={Colors.text.secondary} />,
          type: 'toggle' as const,
          value: notificationsEnabled,
          action: () => setNotificationsEnabled(!notificationsEnabled)
        },
        {
          id: 'units',
          title: 'Measurement Units',
          subtitle: 'Kilometers',
          icon: <Ruler size={20} color={Colors.text.secondary} />,
          type: 'selector' as const,
          options: ['Kilometers', 'Miles'],
          action: () => {
            Alert.alert(
              'Select Units',
              'Choose your preferred measurement units',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Kilometers', onPress: () => {} },
                { text: 'Miles', onPress: () => {} }
              ]
            );
          }
        }
      ]
    },
    {
      title: 'Data',
      items: [
        {
          id: 'clear_cache',
          title: 'Clear Cache',
          subtitle: 'Remove cached data and searches',
          icon: <Trash2 size={20} color={Colors.text.secondary} />,
          type: 'action' as const,
          action: handleClearCache
        }
      ]
    },
    {
      title: 'About',
      items: [
        {
          id: 'app_version',
          title: 'App Version',
          subtitle: '1.0.0',
          icon: <Info size={20} color={Colors.text.secondary} />,
          type: 'display' as const,
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          icon: <LogOut size={20} color={Colors.danger} />,
          type: 'action' as const,
          action: handleLogout
        }
      ]
    }
  ];

  const renderSettingItem = (item: SettingItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.settingItem}
            onPress={item.action}
          >
            <View style={styles.settingLeft}>
              {item.icon}
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <Switch
              value={item.value as boolean}
              onValueChange={item.action}
              trackColor={{ false: Colors.gray[300], true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </TouchableOpacity>
        );

      case 'navigation':
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.settingItem}
            onPress={() => item.route && router.push(item.route)}
          >
            <View style={styles.settingLeft}>
              {item.icon}
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        );

      case 'selector':
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.settingItem}
            onPress={item.action}
          >
            <View style={styles.settingLeft}>
              {item.icon}
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        );

      case 'action':
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.settingItem}
            onPress={item.action}
          >
            <View style={styles.settingLeft}>
              {item.icon}
              <View style={styles.settingInfo}>
                <Text style={[
                  styles.settingTitle,
                  item.id === 'logout' && { color: Colors.danger }
                ]}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );

      case 'display':
      default:
        return (
          <View key={item.id} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {item.icon}
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSubtitle}>Features and Settings</Text>
        </View>

        {settingsGroups.map((group, index) => (
          <View key={index} style={styles.settingGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContent}>
              {group.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  settingGroup: {
    marginTop: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});