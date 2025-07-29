import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { pingServer, testConnection, getServerInfo } from '@/services/api';

export default function NetworkTester() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const runNetworkTests = async () => {
    setIsTesting(true);
    setTestResults([]);

    addResult('🔍 Starting network tests...');

    // Get server info
    const serverInfo = getServerInfo();
    addResult(`📡 Server Info: ${JSON.stringify(serverInfo)}`);

    // Test 1: Simple ping
    addResult('🏓 Testing basic connectivity...');
    try {
      const pingResult = await pingServer();
      addResult(`🏓 Ping test: ${pingResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (error) {
      addResult(`🏓 Ping error: ${error}`);
    }

    // Test 2: API connection
    addResult('🌐 Testing API connection...');
    try {
      const apiResult = await testConnection();
      addResult(`🌐 API test: ${apiResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (error) {
      addResult(`🌐 API error: ${error}`);
    }

    setIsTesting(false);
    addResult('✅ Network tests completed');
  };

  const showTroubleshootingGuide = () => {
    Alert.alert(
      'Network Troubleshooting Guide',
      `1. Make sure your backend server is running:
         - Go to startrit_backend folder
         - Run: npm start
         
2. Check if you're on the same network:
         - Both devices should be on same WiFi
         
3. Verify the IP address:
         - Current: ${getServerInfo().baseUrl}
         - Run 'ipconfig' on Windows to find your IP
         
4. Test in browser:
         - Open: http://192.168.0.132:3001
         - Should show server response
         
5. Check firewall:
         - Allow port 3001 through Windows firewall`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Connectivity Tester</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isTesting && styles.buttonDisabled]}
          onPress={runNetworkTests}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Testing...' : 'Run Network Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={showTroubleshootingGuide}
        >
          <Text style={styles.buttonText}>Troubleshooting Guide</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
