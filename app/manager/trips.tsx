import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { getTripsByManager, Trip } from '@/services/api';
import { router } from 'expo-router';
import {
  MapPin,
  Bus,
  Clock,
  User as UserIcon,
  Navigation,
  Filter,
  ArrowRight,
  Calendar,
} from 'lucide-react-native';
import Navbar from '@/components/Navbar';

type TripStatus = 'all' | 'scheduled' | 'in_progress' | 'completed';

export default function ManagerTripsScreen() {
  const { user } = useAuth();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<TripStatus>('all');

  const filterOptions: { key: TripStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    if (user?.username) {
      fetchAllTrips();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [allTrips, selectedFilter]);

  const fetchAllTrips = async () => {
    if (!user?.username) return;
    
    setLoading(true);
    try {
      const data = await getTripsByManager(user.username);
      setAllTrips(data);
    } catch (e: any) {
      console.error('Error fetching trips:', e);

      // Check if it's a network error
      if (
        e.message.includes('Network request failed') ||
        e.message.includes('fetch')
      ) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => fetchAllTrips() },
          ]
        );
      } else {
        Alert.alert('Error', e.message || 'Failed to fetch trips');
      }
      setAllTrips([]);
    }
    setLoading(false);
  };

  const applyFilter = () => {
    if (selectedFilter === 'all') {
      setFilteredTrips(allTrips);
    } else {
      const filtered = allTrips.filter(trip => trip.trip_status === selectedFilter);
      setFilteredTrips(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllTrips();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterCount = (status: TripStatus) => {
    if (status === 'all') return allTrips.length;
    return allTrips.filter(trip => trip.trip_status === status).length;
  };

  const handleTripPress = (trip: Trip) => {
    try {
      const tripData = encodeURIComponent(JSON.stringify(trip));
      
      switch (trip.trip_status) {
        case 'completed':
          router.push(`/trip-details/completed?trip=${tripData}`);
          break;
        case 'in_progress':
          router.push(`/trip-details/active?trip=${tripData}`);
          break;
        case 'scheduled':
          router.push(`/trip-details/scheduled?trip=${tripData}`);
          break;
        default:
          // For other statuses, show basic details
          router.push(`/trip-details/completed?trip=${tripData}`);
          break;
      }
    } catch (error) {
      console.error('Error navigating to trip details:', error);
      Alert.alert('Error', 'Failed to open trip details');
    }
  };

  const renderFilterButton = (option: { key: TripStatus; label: string }) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.filterButton,
        selectedFilter === option.key && styles.selectedFilterButton,
      ]}
      onPress={() => setSelectedFilter(option.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === option.key && styles.selectedFilterButtonText,
        ]}
      >
        {option.label}
      </Text>
      <View style={styles.filterCount}>
        <Text style={styles.filterCountText}>{getFilterCount(option.key)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleTripPress(item)}>
      {/* Trip Route Information */}
      <View style={styles.routeContainer}>
        {/* Start Location */}
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <MapPin size={16} color="#10B981" />
            <Text style={styles.locationLabel}>From</Text>
          </View>
          <Text style={styles.locationName}>{item.start_location || 'N/A'}</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.dateTimeText}>{formatDate(item.start_time)}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.dateTimeText}>{formatTime(item.start_time)}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={24} color="#DC2626" />
        </View>

        {/* End Location */}
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <MapPin size={16} color="#EF4444" />
            <Text style={styles.locationLabel}>To</Text>
          </View>
          <Text style={styles.locationName}>{item.end_location || 'N/A'}</Text>
          <View style={styles.dateTimeContainer}>
            {item.end_time ? (
              <>
                <View style={styles.dateTimeRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.dateTimeText}>{formatDate(item.end_time)}</Text>
                </View>
                <View style={styles.dateTimeRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.dateTimeText}>{formatTime(item.end_time)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.pendingText}>Pending</Text>
            )}
          </View>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.tripDetailsContainer}>
        <View style={styles.tripDetailItem}>
          <Text style={styles.tripDetailLabel}>Trip ID</Text>
          <Text style={styles.tripDetailValue}>#{item.trip_id}</Text>
        </View>
        <View style={styles.tripDetailItem}>
          <Text style={styles.tripDetailLabel}>Driver ID</Text>
          <Text style={styles.tripDetailValue} numberOfLines={2}>
            {item.driver_username || 'N/A'}
          </Text>
        </View>
        <View style={styles.tripDetailItem}>
          <Text style={styles.tripDetailLabel}>Vehicle ID</Text>
          <Text style={styles.tripDetailValue}>{item.vehicle_id || 'N/A'}</Text>
        </View>
        <View style={styles.tripDetailItem}>
          <Text style={styles.tripDetailLabel}>Status</Text>
          <Text style={styles.tripDetailValue} numberOfLines={2}>
            {item.trip_status.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Real-time Location for Active Trips */}
      {item.latitude &&
        item.longitude &&
        item.trip_status === 'in_progress' && (
          <View style={styles.locationInfo}>
            <View style={styles.locationInfoHeader}>
              <MapPin size={16} color="#DC2626" />
              <Text style={styles.locationInfoTitle}>Live Location</Text>
            </View>

            <Text style={styles.locationInfoText}>
              {item.address ||
                `GPS: ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(
                  4
                )}`}
            </Text>

            <View style={styles.coordinates}>
              <Text style={styles.coordinateText}>
                Lat: {item.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinateText}>
                Lng: {item.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

      {/* Tap to View Details Indicator */}
      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Tap to view details</Text>
        <ArrowRight size={16} color="#DC2626" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Navbar title="Trip Management" />
      <View style={styles.headerContainer}>
        <Text style={styles.subtitle}>
          Monitor and manage all trips under your supervision
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <Filter size={16} color="#6B7280" />
          <Text style={styles.filtersTitle}>Filter by Status</Text>
        </View>
        <View style={styles.filtersGrid}>
          {filterOptions.map(renderFilterButton)}
        </View>
      </View>

      {/* Trip List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.trip_id.toString()}
          renderItem={renderTrip}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                  ? 'No trips found.' 
                  : `No ${selectedFilter.replace('_', ' ')} trips found.`}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchAllTrips}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 0,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 16,
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
  },
  selectedFilterButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
    color: '#6B7280',
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: '#6B7280',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationContainer: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  dateTimeContainer: {
    gap: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  pendingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  arrowContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tripDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tripDetailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minHeight: 50,
    justifyContent: 'center',
  },
  tripDetailLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tripDetailValue: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  locationInfo: {
    backgroundColor: '#F0F9EB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginBottom: 16,
  },
  locationInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  coordinates: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  coordinateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tapText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginRight: 4,
  },
});