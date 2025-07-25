import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Index() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Route based on user role
  switch (user.role) {
    case 'user':
      return <Redirect href="/(tabs)" />;
    case 'driver':
      return <Redirect href="/conductor/trips" />;
    case 'manager':
      return <Redirect href="/staff/dashboard" />;
    default:
      return <Redirect href="/(tabs)" />;
  }
}