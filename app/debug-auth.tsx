import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { conductorAPI } from '@/services/api';

export default function DebugAuthScreen() {
  const { testConnection } = useAuth();
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthConnection = async () => {
    try {
      addResult('Testing auth connection...');
      const success = await testConnection();
      addResult(`Auth connection: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error: any) {
      addResult(`Auth connection error: ${error.message}`);
    }
  };

  const testAPIConnection = async () => {
    try {
      addResult('Testing API connection...');
      const success = await conductorAPI.testConnection();
      addResult(`API connection: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error: any) {
      addResult(`API connection error: ${error.message}`);
    }
  };

  const testHealthEndpoint = async () => {
    try {
      addResult('Testing health endpoint...');
      const health = await conductorAPI.getServerHealth();
      addResult(`Health check: SUCCESS - ${health.message}`);
    } catch (error: any) {
      addResult(`Health check error: ${error.message}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const testRegistration = async () => {
    try {
      addResult('Testing registration with sample data...');
      const { register } = useAuth();
      
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPass123',
        role: 'user' as const,
        firstname: 'Test',
        lastname: 'User'
      };
      
      const result = await register(testUser);
      addResult(`Registration: SUCCESS - User ID: ${result.user_id}`);
    } catch (error: any) {
      addResult(`Registration error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Authentication Debug</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testAuthConnection}>
          <Text style={styles.buttonText}>Test Auth Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testAPIConnection}>
          <Text style={styles.buttonText}>Test API Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testHealthEndpoint}>
          <Text style={styles.buttonText}>Test Health Endpoint</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testRegistration}>
          <Text style={styles.buttonText}>Test Registration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});