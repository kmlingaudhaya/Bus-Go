import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Bus,
  Ticket,
  MapPin,
  Bell,
  User,
  Home,
  AlertTriangle,
  Info,
} from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Only show tabs for users
  if (user?.role !== 'user') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 80,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard') || 'Dashboard',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="bluetooth"
        options={{
          title: t('OBD2') || 'obd2',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: t('search') || 'Search',
          tabBarIcon: ({ size, color }) => <Bus size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t('my_tickets') || 'My Tickets',
          tabBarIcon: ({ size, color }) => <Ticket size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: t('track_bus') || 'Track Bus',
          tabBarIcon: ({ size, color }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grievances"
        options={{
          title: t('grievances') || 'Grievances',
          tabBarIcon: ({ size, color }) => (
            <AlertTriangle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip-details"
        options={{
          title: t('trip_details') || 'Trip Details',
          tabBarIcon: ({ size, color }) => <Info size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile') || 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
