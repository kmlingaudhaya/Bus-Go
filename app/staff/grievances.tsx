import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Complaint } from '@/types';

const API_URL = 'https://safeway-backend-75xq.onrender.com/api/complaints';

export default function StaffGrievancesScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    let data = complaints;
    if (typeFilter) {
      data = data.filter(c => (c.type || '').toLowerCase().includes(typeFilter.toLowerCase()));
    }
    if (usernameFilter) {
      data = data.filter(c => c.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    }
    setFiltered(data);
  }, [typeFilter, usernameFilter, complaints]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setComplaints(data);
    } catch (e) {
      setComplaints([]);
    }
    setLoading(false);
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <View style={styles.card}>
      <Text style={styles.complaintText}>{item.complaint_text}</Text>
      <Text style={styles.meta}>Place: {item.place}</Text>
      <Text style={styles.meta}>Bus Number: {item.bus_number || '-'}</Text>
      <Text style={styles.meta}>Type: {item.type || '-'}</Text>
      <Text style={styles.meta}>By: {item.username}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Grievances</Text>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Filter by type"
          value={typeFilter}
          onChangeText={setTypeFilter}
        />
        <TextInput
          style={styles.input}
          placeholder="Filter by username"
          value={usernameFilter}
          onChangeText={setUsernameFilter}
        />
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchComplaints}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#DC2626" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.complaint_id.toString()}
          renderItem={renderComplaint}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No complaints found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
    paddingTop:25
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  refreshBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  complaintText: {
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