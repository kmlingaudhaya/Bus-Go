import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { authStore } from '@/store/authStore';
import { router } from 'expo-router';

export default function DebugScreen() {
  const { user, loading, testConnection } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
  };

  useEffect(() => {
    addDebugInfo('Debug screen mounted');
    addDebugInfo(`User: ${JSON.stringify(user)}`);
    addDebugInfo(`Loading: ${loading}`);
  }, [user, loading]);

  const testBackendConnection = async () => {
    try {
      addDebugInfo('Testing backend connection...');
      const isConnected = await testConnection();
      addDebugInfo(`Backend connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      Alert.alert(
        'Connection Test',
        isConnected ? 'Backend is accessible' : 'Backend is not accessible'
      );
    } catch (error) {
      addDebugInfo(`Backend test error: ${error}`);
      Alert.alert('Connection Test', `Error: ${error}`);
    }
  };

  const clearStoredData = async () => {
    try {
      await authStore.logout();
      addDebugInfo('Stored data cleared');
      Alert.alert('Success', 'Stored data cleared');
    } catch (error) {
      addDebugInfo(`Clear data error: ${error}`);
      Alert.alert('Error', `Failed to clear data: ${error}`);
    }
  };

  const handleConductorRoleIssue = async () => {
    try {
      addDebugInfo('Handling conductor role issue...');
      await authStore.logout();
      addDebugInfo(
        'Stored data cleared - please login again with new role system'
      );
      Alert.alert(
        'Role System Updated',
        'The role system has been updated. Your old "conductor" role has been cleared. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to auth screen
              router.replace('/auth');
            },
          },
        ]
      );
    } catch (error) {
      addDebugInfo(`Conductor role fix error: ${error}`);
      Alert.alert('Error', `Failed to fix role issue: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          User: {user ? JSON.stringify(user) : 'null'}
        </Text>
        <Text style={styles.infoText}>
          Loading: {loading ? 'true' : 'false'}
        </Text>
        <Text style={styles.infoText}>
          Authenticated: {authStore.isAuthenticated() ? 'true' : 'false'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testBackendConnection}>
          <Text style={styles.buttonText}>Test Backend</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={clearStoredData}>
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleConductorRoleIssue}
        >
          <Text style={styles.buttonText}>Fix Conductor Role</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Log:</Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.logText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
