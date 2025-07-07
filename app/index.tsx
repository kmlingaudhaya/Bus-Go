import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Route based on user role
  switch (user.role) {
    case 'passenger':
      return <Redirect href="/(tabs)" />;
    case 'conductor':
      return <Redirect href="/conductor/trips" />;
    case 'staff':
      return <Redirect href="/staff/dashboard" />;
    default:
      return <Redirect href="/(tabs)" />;
  }
}