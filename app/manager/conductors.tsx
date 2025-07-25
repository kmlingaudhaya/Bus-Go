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
import { Trip } from '@/services/api';
import { conductorAPI } from '@/services/api';
import {
  MapPin,
  Bus,
  Clock,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StaffConductorsScreen() {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTripsWithConductors();
  }, []);

  const fetchTripsWithConductors = async () => {
    setLoading(true);
    try {
      const data = await conductorAPI.getAllTripsWithConductorInfo();
      setTrips(data);
    } catch (e: any) {
      console.error('Error fetching trips:', e);
      if (
        e.message.includes('Network request failed') ||
        e.message.includes('fetch')
      ) {
        Alert.alert(
          t('connection_error') || 'Network Error',
          t('connection_error_message') ||
            'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            {
              text: t('retry') || 'Retry',
              onPress: () => fetchTripsWithConductors(),
            },
          ]
        );
      } else {
        Alert.alert(
          t('error') || 'Error',
          e.message || t('failed_to_fetch_trips') || 'Failed to fetch trips'
        );
      }
      setTrips([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTripsWithConductors();
    setRefreshing(false);
  };

  const getStatusColor = (status?: string) => {
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

  const getStatusBgColor = (status?: string) => {
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return t('not_available') || 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <UserIcon size={20} color="#DC2626" />
          <Text style={styles.username}>{item.conductor}</Text>
        </View>
        {item.trip_status && (
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
              {t(item.trip_status) ||
                item.trip_status.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      {/* Only show trip info, not driver/manager */}

      {/* Trip Information */}
      {item.trip_id && (
        <View style={styles.tripInfo}>
          <Text style={styles.tripTitle}>
            {t('current_trip') || 'Current Trip'}
          </Text>

          <View style={styles.tripDetails}>
            <View style={styles.tripDetailRow}>
              <Bus size={16} color="#6B7280" />
              <Text style={styles.tripDetailText}>
                {t('vehicle') || 'Vehicle'}:{' '}
                {item.vehicle_id || t('not_available') || 'N/A'}
              </Text>
            </View>

            <View style={styles.tripDetailRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.tripDetailText}>
                {t('start') || 'Start'}: {formatDateTime(item.start_time)}
              </Text>
            </View>
          </View>

          {/* Location Information */}
          {item.latitude && item.longitude && (
            <View style={styles.locationInfo}>
              <View style={styles.locationHeader}>
                <MapPin size={16} color="#DC2626" />
                <Text style={styles.locationTitle}>
                  {t('current_location') || 'Current Location'}
                </Text>
              </View>

              <Text style={styles.locationText}>
                {item.address ||
                  `${t('gps') || 'GPS'}: ${item.latitude.toFixed(
                    4
                  )}, ${item.longitude.toFixed(4)}`}
              </Text>

              <View style={styles.coordinates}>
                <Text style={styles.coordinateText}>
                  {t('latitude') || 'Lat'}: {item.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinateText}>
                  {t('longitude') || 'Lng'}: {item.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {!item.trip_id && (
        <View style={styles.noTrip}>
          <Text style={styles.noTripText}>
            {t('no_active_trip') || 'No active trip'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {t('conductor_tracking') || 'Conductor Tracking'}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchTripsWithConductors}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <RefreshCw size={22} color="#DC2626" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        {t('real_time_status') || 'Real-time location and trip status'}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>
            {t('loading_ellipsis') || 'Loading...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) =>
            item.trip_id ? `trip_${item.trip_id}` : Math.random().toString()
          }
          renderItem={renderTrip}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('no_conductors_found') || 'No conductors found.'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchTripsWithConductors}
              >
                <Text style={styles.retryButtonText}>
                  {t('retry') || 'Retry'}
                </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626', // changed from blue
    marginBottom: 0,
    textAlign: 'left',
    paddingTop: 25,
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginTop: 20,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: 20,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  details: {
    marginBottom: 10,
  },
  meta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  tripInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  tripDetails: {
    marginBottom: 8,
  },
  tripDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
  },
  coordinates: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  coordinateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noTrip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  noTripText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
