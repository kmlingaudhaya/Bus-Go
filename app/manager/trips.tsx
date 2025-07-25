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
import { conductorAPI, Trip as APITrip } from '@/services/api';
import {
  MapPin,
  Bus,
  Clock,
  User as UserIcon,
  Navigation,
} from 'lucide-react-native';

export default function StaffTripsScreen() {
  const [trips, setTrips] = useState<APITrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTripsWithConductorInfo();
  }, []);

  const fetchTripsWithConductorInfo = async () => {
    setLoading(true);
    try {
      const data = await conductorAPI.getAllTripsWithConductorInfo();
      setTrips(data);
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
            { text: 'Retry', onPress: () => fetchTripsWithConductorInfo() },
          ]
        );
      } else {
        Alert.alert('Error', e.message || 'Failed to fetch trips');
      }
      setTrips([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTripsWithConductorInfo();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'scheduled':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'scheduled':
        return '#D1FAE5';
      case 'in_progress':
        return '#DBEAFE';
      case 'completed':
        return '#F3F4F6';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderTrip = ({ item }: { item: APITrip }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripId}>Trip #{item.trip_id}</Text>
          <Text style={styles.route}>
            {item.start_location} → {item.end_location}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(item.trip_status) },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.trip_status) },
            ]}
          >
            {item.trip_status.toUpperCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Bus size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Vehicle: {item.vehicle_number || 'N/A'}
          </Text>
        </View>

        {item.driver_first_name && (
          <View style={styles.detailRow}>
            <UserIcon size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Driver: {item.driver_first_name} {item.driver_last_name || ''}
            </Text>
          </View>
        )}

        {item.conductor_username && (
          <View style={styles.detailRow}>
            <UserIcon size={16} color="#DC2626" />
            <Text style={styles.detailText}>
              Conductor: {item.conductor_username}
              {item.conductor_firstname &&
                ` (${item.conductor_firstname} ${
                  item.conductor_lastname || ''
                })`}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Start: {formatDateTime(item.start_time)}
          </Text>
        </View>

        {item.end_time && (
          <View style={styles.detailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              End: {formatDateTime(item.end_time)}
            </Text>
          </View>
        )}

        {item.distance_travelled && (
          <View style={styles.detailRow}>
            <Navigation size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Distance: {item.distance_travelled} km
            </Text>
          </View>
        )}

        {item.average_speed && (
          <View style={styles.detailRow}>
            <Navigation size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Avg Speed: {item.average_speed} km/h
            </Text>
          </View>
        )}
      </View>

      {/* Real-time Location */}
      {item.latitude &&
        item.longitude &&
        item.trip_status === 'in_progress' && (
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <MapPin size={16} color="#DC2626" />
              <Text style={styles.locationTitle}>Live Location</Text>
            </View>

            <Text style={styles.locationText}>
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

      {/* Trip Statistics */}
      {(item.distance_travelled || item.average_speed || item.max_speed) && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Trip Statistics</Text>
          <View style={styles.statsGrid}>
            {item.distance_travelled && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {item.distance_travelled} km
                </Text>
              </View>
            )}
            {item.average_speed && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Speed</Text>
                <Text style={styles.statValue}>{item.average_speed} km/h</Text>
              </View>
            )}
            {item.max_speed && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max Speed</Text>
                <Text style={styles.statValue}>{item.max_speed} km/h</Text>
              </View>
            )}
            {item.fuel_consumed && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fuel Used</Text>
                <Text style={styles.statValue}>{item.fuel_consumed} L</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Trips</Text>
      <Text style={styles.subtitle}>
        Real-time trip monitoring and conductor tracking
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.trip_id.toString()}
          renderItem={renderTrip}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No trips found.</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchTripsWithConductorInfo}
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  route: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
  },
  locationInfo: {
    marginTop: 12,
    backgroundColor: '#F0F9EB', // Light green background
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Green border
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981', // Green color
    marginLeft: 8,
  },
  locationText: {
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
  statsContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB', // Light gray background
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E7FF', // Blue border
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    width: '45%', // Two items per row
    marginBottom: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
});
