import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { authStore } from '@/store/authStore';

export default function Index() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  console.log('Index component - user:', user, 'loading:', loading);

  // Fallback for any unexpected states
  if (loading === undefined) {
    console.log('Loading is undefined, showing fallback');
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Initializing...</Text>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => router.push('/debug')}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={styles.fallback}>
        <LoadingScreen />
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => router.push('/debug')}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Redirect href="/auth" />;
  }

  console.log('User found, role:', user.role);

  // Handle old role mapping
  let mappedRole = user.role;
  if (user.role === 'conductor') {
    mappedRole = 'driver';
    console.log('Mapping old role "conductor" to "driver"');
  }

  // Route based on mapped role
  switch (mappedRole) {
    case 'user':
      return <Redirect href="/(tabs)" />;
    case 'driver':
      return <Redirect href="/driver/dashboard" />;
    case 'manager':
      return <Redirect href="/manager/dashboard" />;
    default:
      // If we have an unknown role, show an error and option to clear data
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Unknown role: {user.role}</Text>
          <Text style={styles.fallbackText}>
            Please clear your stored data and login again.
          </Text>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Clear Data',
                'This will clear your stored login data. You will need to login again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                      await authStore.logout();
                      router.replace('/auth');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.debugButtonText}>Clear Data & Login Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.debugButton,
              { marginTop: 10, backgroundColor: '#6B7280' },
            ]}
            onPress={() => router.push('/debug')}
          >
            <Text style={styles.debugButtonText}>Debug</Text>
          </TouchableOpacity>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
