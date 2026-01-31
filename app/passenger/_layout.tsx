import { Tabs } from 'expo-router';
import { Home, Search, MapPin, CreditCard, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function PassengerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: 'Payment',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />
      
      {/* Hide other screens from tab bar */}
      <Tabs.Screen
        name="simple"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="map-simple"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="active-buses"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bus-tracking"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="crowd-report"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="nearby-buses"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="off-route-guidance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="route-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routes-buses"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="saved-places"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}