import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bus } from 'lucide-react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Bus size={48} color="#2563EB" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
});