import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const dummyTrips = [
  {
    trip_id: 1,
    bus_number: 'TN01AB1234',
    route: 'Chennai - Coimbatore',
    driver: 'Ravi Kumar',
    status: 'Completed',
  },
  {
    trip_id: 2,
    bus_number: 'TN02CD5678',
    route: 'Madurai - Trichy',
    driver: 'Suresh Babu',
    status: 'Ongoing',
  },
  {
    trip_id: 3,
    bus_number: 'TN03EF9012',
    route: 'Salem - Erode',
    driver: 'Priya Devi',
    status: 'Scheduled',
  },
  {
    trip_id: 4,
    bus_number: 'TN04GH3456',
    route: 'Tirunelveli - Madurai',
    driver: 'Murugan Selvam',
    status: 'Completed',
  },
];

export default function StaffTripsScreen() {
  const renderTrip = ({ item }: { item: typeof dummyTrips[0] }) => (
    <View style={styles.card}>
      <Text style={styles.busNumber}>Bus: {item.bus_number}</Text>
      <Text style={styles.meta}>Route: {item.route}</Text>
      <Text style={styles.meta}>Driver: {item.driver}</Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#059669';
      case 'Ongoing': return '#2563EB';
      case 'Scheduled': return '#EA580C';
      default: return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Trips (Dummy Data)</Text>
      <FlatList
        data={dummyTrips}
        keyExtractor={item => item.trip_id.toString()}
        renderItem={renderTrip}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No trips found.</Text>}
      />
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
    color: '#2563EB',
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
  busNumber: {
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
  status: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
}); 