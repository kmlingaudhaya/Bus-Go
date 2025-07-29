import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import TicketCard from '@/components/TicketCard';
import { mockBookings } from '@/data/mockData';
import { Booking } from '@/types';
import { Calendar, Filter } from 'lucide-react-native';

export default function TicketsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    // Filter bookings for current user
    const userBookings = mockBookings.filter(booking => booking.userId === String(user?.user_id));
    setBookings(userBookings);
  }, [user]);

  const filteredBookings = bookings.filter(booking => {
    switch (filter) {
      case 'upcoming':
        return booking.status === 'confirmed' && booking.journeyDate > new Date();
      case 'completed':
        return booking.status === 'completed';
      default:
        return true;
    }
  });

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (user?.role !== 'passenger') {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Access Denied</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>This section is only available for passengers</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>View and manage your bookings</Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <Filter size={16} color="#6B7280" />
          <Text style={styles.filtersTitle}>Filter</Text>
        </View>
        <View style={styles.filtersGrid}>
          {['all', 'upcoming', 'completed'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                filter === type && styles.selectedFilterButton,
              ]}
              onPress={() => setFilter(type as typeof filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === type && styles.selectedFilterButtonText,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TicketCard booking={item} />
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tickets found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'upcoming'
                ? "You don't have any upcoming trips"
                : filter === 'completed'
                ? "You don't have any completed trips"
                : "Start by booking your first trip"
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});