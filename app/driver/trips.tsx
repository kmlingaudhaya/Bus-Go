import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { mockNotifications } from '@/data/mockData';
import { Trip } from '@/types';
import {
  Clock,
  MapPin,
  Users,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Play,
  Bus,
} from 'lucide-react-native';
import {
  getTripsByDriver,
  updateTripStatus,
  testConnection,
  getServerInfo,
  Trip as APITrip,
} from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DriverTripsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [assignedTrips, setAssignedTrips] = useState<APITrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<
    'online' | 'offline' | 'checking'
  >('checking');
  const unreadNotifications = mockNotifications.filter(
    (n) => !n.read && n.userId === user?.user_id?.toString()
  ).length;

  // Refetch trips whenever the page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.username) {
        fetchDriverTrips();
      }
    }, [user?.username])
  );

  useEffect(() => {
    if (user?.username) {
      // Test connection first
      const testConnectionAsync = async () => {
        console.log('🔍 Testing API connection...');
        const serverInfo = getServerInfo();
        console.log('Server Info:', serverInfo);

        const isConnected = await testConnection();
        console.log('Connection test result:', isConnected);

        if (isConnected) {
          fetchDriverTrips();
        } else {
          setNetworkStatus('offline');
          Alert.alert(
            'Connection Error',
            `Unable to connect to server at ${serverInfo.baseUrl}. Please check if the server is running.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: () => fetchDriverTrips() },
            ]
          );
        }
      };

      testConnectionAsync();
    }
  }, [user]);

  const fetchDriverTrips = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      setNetworkStatus('checking');

      const trips = await getTripsByDriver(user.username);
      setAssignedTrips(trips);
      setNetworkStatus('online');
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      setNetworkStatus('offline');

      // Check if it's a network error
      if (
        error.message.includes('Network request failed') ||
        error.message.includes('fetch')
      ) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => fetchDriverTrips() },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch trips. Please try again.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => fetchDriverTrips() },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTripAction = async (
    trip: APITrip,
    action: 'accept' | 'decline' | 'start'
  ) => {
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              let newStatus: string;
              switch (action) {
                case 'accept':
                  newStatus = 'scheduled';
                  break;
                case 'start':
                  newStatus = 'in_progress';
                  break;
                case 'decline':
                  newStatus = 'cancelled';
                  break;
                default:
                  newStatus = 'scheduled';
              }

              await updateTripStatus(trip.trip_id, newStatus);

              // Update local state
              setAssignedTrips((prev) =>
                prev.map((t) =>
                  t.trip_id === trip.trip_id
                    ? { ...t, trip_status: newStatus }
                    : t
                )
              );

              Alert.alert('Success', `Trip ${action}ed successfully`);
            } catch (error: any) {
              console.error('Error updating trip status:', error);
              Alert.alert(
                'Error',
                'Failed to update trip status. Please try again.'
              );
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar title={t('my_trips')} notificationCount={unreadNotifications} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>{t('loading_trips')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar title={t('my_trips')} notificationCount={unreadNotifications} />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('good_morning')}</Text>
          <Text style={styles.driverName}>
            {user?.firstname
              ? `${user.firstname} ${user.lastname || ''}`
              : user?.username}
          </Text>
          <Text style={styles.employeeId}>User ID: {user?.user_id}</Text>

          {/* Network Status Indicator */}
          <View
            style={[
              styles.networkStatus,
              {
                backgroundColor:
                  networkStatus === 'online'
                    ? '#D1FAE5'
                    : networkStatus === 'offline'
                    ? '#FEE2E2'
                    : '#FEF3C7',
              },
            ]}
          >
            <Text
              style={[
                styles.networkStatusText,
                {
                  color:
                    networkStatus === 'online'
                      ? '#059669'
                      : networkStatus === 'offline'
                      ? '#DC2626'
                      : '#D97706',
                },
              ]}
            >
              {networkStatus === 'online'
                ? t('online_status')
                : networkStatus === 'offline'
                ? t('offline_status')
                : t('checking_status')}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {assignedTrips.filter((t) => t.trip_status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>{t('pending')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {
                assignedTrips.filter((t) => t.trip_status === 'scheduled')
                  .length
              }
            </Text>
            <Text style={styles.statLabel}>{t('scheduled')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {
                assignedTrips.filter((t) => t.trip_status === 'in_progress')
                  .length
              }
            </Text>
            <Text style={styles.statLabel}>{t('active')}</Text>
          </View>
        </View>

        {/* Current Trip Section */}
        {assignedTrips.filter((trip) => trip.trip_status === 'in_progress')
          .length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Trip</Text>
            {assignedTrips
              .filter((trip) => trip.trip_status === 'in_progress')
              .map((trip) => (
                <View key={trip.trip_id} style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.tripRoute}>
                        {trip.start_location} → {trip.end_location}
                      </Text>
                      <Text style={styles.vehicleNumber}>
                        Vehicle ID: {trip.vehicle_id || t('vehicle_na')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBgColor(trip.trip_status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(trip.trip_status) },
                        ]}
                      >
                        {t(trip.trip_status) ||
                          trip.trip_status.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.tripDetailRow}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.tripDetailText}>
                        {t('start')}: {formatDateTime(trip.start_time)}
                      </Text>
                    </View>
                    {trip.driver_username && (
                      <View style={styles.tripDetailRow}>
                        <Users size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('driver')}: {trip.driver_username}
                        </Text>
                      </View>
                    )}
                    {trip.distance_travelled && (
                      <View style={styles.tripDetailRow}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('distance')}: {trip.distance_travelled} km
                        </Text>
                      </View>
                    )}

                    {/* GPS Data Display */}
                    {(trip.latitude || trip.longitude || trip.address) && (
                      <View style={styles.gpsDataContainer}>
                        <Text style={styles.gpsDataTitle}>
                          📍 {t('gps_data')}
                        </Text>
                        {trip.latitude && trip.longitude && (
                          <Text style={styles.gpsDataText}>
                            {t('coordinates')}: {trip.latitude.toFixed(6)},{' '}
                            {trip.longitude.toFixed(6)}
                          </Text>
                        )}
                        {trip.address && (
                          <Text style={styles.gpsDataText}>
                            {t('address')}: {trip.address}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.tripActions}>
                    <TouchableOpacity
                      style={[styles.tripButton, styles.trackingButton]}
                      onPress={() => {
                        Alert.alert(
                          t('go_to_tracking'),
                          t('navigate_to_tracking'),
                          [
                            { text: t('cancel'), style: 'cancel' },
                            {
                              text: t('go_to_tracking'),
                              onPress: () => {
                                router.push('/driver/tracking');
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <MapPin size={16} color="#FFFFFF" />
                      <Text style={styles.trackingButtonText}>
                        {t('go_to_tracking')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Assigned Trips Section */}
        {assignedTrips.filter(
          (trip) =>
            trip.trip_status !== 'in_progress' &&
            trip.trip_status !== 'completed'
        ).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('assigned_trips')}</Text>
            {assignedTrips
              .filter(
                (trip) =>
                  trip.trip_status !== 'in_progress' &&
                  trip.trip_status !== 'completed'
              )
              .map((trip) => (
                <View key={trip.trip_id} style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.tripRoute}>
                        {trip.start_location} → {trip.end_location}
                      </Text>
                      <Text style={styles.vehicleNumber}>
                        Vehicle ID: {trip.vehicle_id || t('vehicle_na')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBgColor(trip.trip_status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(trip.trip_status) },
                        ]}
                      >
                        {t(trip.trip_status) ||
                          trip.trip_status.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.tripDetailRow}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.tripDetailText}>
                        {t('start')}: {formatDateTime(trip.start_time)}
                      </Text>
                    </View>
                    {trip.driver_username && (
                      <View style={styles.tripDetailRow}>
                        <Users size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('driver')}: {trip.driver_username}
                        </Text>
                      </View>
                    )}
                    {trip.distance_travelled && (
                      <View style={styles.tripDetailRow}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('distance')}: {trip.distance_travelled} km
                        </Text>
                      </View>
                    )}

                    {/* GPS Data Display */}
                    {(trip.latitude || trip.longitude || trip.address) && (
                      <View style={styles.gpsDataContainer}>
                        <Text style={styles.gpsDataTitle}>
                          📍 {t('gps_data')}
                        </Text>
                        {trip.latitude && trip.longitude && (
                          <Text style={styles.gpsDataText}>
                            {t('coordinates')}: {trip.latitude.toFixed(6)},{' '}
                            {trip.longitude.toFixed(6)}
                          </Text>
                        )}
                        {trip.address && (
                          <Text style={styles.gpsDataText}>
                            {t('address')}: {trip.address}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.tripActions}>
                    {trip.trip_status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.tripButton, styles.acceptButton]}
                          onPress={() => handleTripAction(trip, 'accept')}
                        >
                          <CheckCircle size={16} color="#FFFFFF" />
                          <Text style={styles.acceptButtonText}>
                            {t('accept')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.tripButton, styles.declineButton]}
                          onPress={() => handleTripAction(trip, 'decline')}
                        >
                          <XCircle size={16} color="#DC2626" />
                          <Text style={styles.declineButtonText}>
                            {t('decline')}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {trip.trip_status === 'scheduled' && (
                      <TouchableOpacity
                        style={[styles.tripButton, styles.startButton]}
                        onPress={() => handleTripAction(trip, 'start')}
                      >
                        <Play size={16} color="#FFFFFF" />
                        <Text style={styles.startButtonText}>
                          {t('start_trip')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Trip History Section */}
        {assignedTrips.filter((trip) => trip.trip_status === 'completed')
          .length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip History</Text>
            {assignedTrips
              .filter((trip) => trip.trip_status === 'completed')
              .map((trip) => (
                <View key={trip.trip_id} style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.tripRoute}>
                        {trip.start_location} → {trip.end_location}
                      </Text>
                      <Text style={styles.vehicleNumber}>
                        Vehicle ID: {trip.vehicle_id || t('vehicle_na')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBgColor(trip.trip_status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(trip.trip_status) },
                        ]}
                      >
                        {t(trip.trip_status) ||
                          trip.trip_status.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.tripDetailRow}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.tripDetailText}>
                        {t('start')}: {formatDateTime(trip.start_time)}
                      </Text>
                    </View>
                    {trip.end_time && (
                      <View style={styles.tripDetailRow}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('end')}: {formatDateTime(trip.end_time)}
                        </Text>
                      </View>
                    )}
                    {trip.driver_username && (
                      <View style={styles.tripDetailRow}>
                        <Users size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('driver')}: {trip.driver_username}
                        </Text>
                      </View>
                    )}
                    {trip.distance_travelled && (
                      <View style={styles.tripDetailRow}>
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.tripDetailText}>
                          {t('distance')}: {trip.distance_travelled} km
                        </Text>
                      </View>
                    )}

                    {/* GPS Data Display */}
                    {(trip.latitude || trip.longitude || trip.address) && (
                      <View style={styles.gpsDataContainer}>
                        <Text style={styles.gpsDataTitle}>
                          📍 {t('gps_data')}
                        </Text>
                        {trip.latitude && trip.longitude && (
                          <Text style={styles.gpsDataText}>
                            {t('coordinates')}: {trip.latitude.toFixed(6)},{' '}
                            {trip.longitude.toFixed(6)}
                          </Text>
                        )}
                        {trip.address && (
                          <Text style={styles.gpsDataText}>
                            {t('address')}: {trip.address}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Empty State */}
        {assignedTrips.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyContainer}>
              <Bus size={48} color="#DC2626" />
              <Text style={styles.emptyText}>{t('no_trips_assigned')}</Text>
              <Text style={styles.emptySubtext}>
                {networkStatus === 'offline'
                  ? t('unable_to_connect')
                  : t('no_trips_assigned_subtext')}
              </Text>
              {networkStatus === 'offline' && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchDriverTrips}
                >
                  <Text style={styles.retryButtonText}>
                    {t('retry_connection')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleNumber: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tripDetails: {
    marginBottom: 16,
  },
  tripDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  trackingButton: {
    backgroundColor: '#DC2626',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  trackingButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  declineButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  networkStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gpsDataContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  gpsDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  gpsDataText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
});
