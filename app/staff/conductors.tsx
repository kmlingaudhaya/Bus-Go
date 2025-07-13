import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { User } from '@/types';

const API_URL =
  'https://safeway-backend-75xq.onrender.com/api/user-auth/conductors';

export default function StaffConductorsScreen() {
  const [conductors, setConductors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConductors();
  }, []);

  const fetchConductors = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch conductors');
      const data = await res.json();
      setConductors(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch conductors');
      setConductors([]);
    }
    setLoading(false);
  };

  const renderConductor = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.meta}>Email: {item.email}</Text>
      {item.firstname && (
        <Text style={styles.meta}>First Name: {item.firstname}</Text>
      )}
      {item.lastname && (
        <Text style={styles.meta}>Last Name: {item.lastname}</Text>
      )}
      {item.created_at && (
        <Text style={styles.meta}>
          Joined: {new Date(item.created_at).toLocaleDateString('en-IN')}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Conductors</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#DC2626"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={conductors}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderConductor}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40 }}>
              No conductors found.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626', // changed from blue
    marginBottom: 16,
    textAlign: 'center',
    paddingTop: 25,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1E293B',
  },
  meta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
});
