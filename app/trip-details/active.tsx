import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Truck,
  Navigation,
  RefreshCw,
  Radio,
  Gauge,
  Timer,
} from 'lucide-react-native';
import { Trip, getTripById } from '@/services/api';

export default function ActiveTripDetailsScreen() {
  const { trip: tripParam } = useLocalSearchParams();
  const initialTrip: Trip = JSON.parse(decodeURIComponent(tripParam as string));
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateElapsedTime = () => {
    const start = new Date(trip.start_time);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const refreshTripData = async () => {
    setRefreshing(true);
    try {
      const updatedTrip = await getTripById(trip.trip_id);
      setTrip(updatedTrip);
    } catch (error) {
      console.error('Error refreshing trip data:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds for live tracking
    const interval = setInterval(refreshTripData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Trip Tracking</Text>
        <TouchableOpacity onPress={refreshTripData} style={styles.refreshButton}>
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshTripData} />
        }
      >
        {/* Live Status */}
        <View style={styles.section}>
          <View style={styles.liveStatusCard}>
            <View style={styles.liveIndicator}>
              <Radio size={16} color="#10B981" />
              <Text style={styles.liveText}>LIVE TRACKING</Text>
            </View>
            <Text style={styles.tripId}>Trip #{trip.trip_id}</Text>
            <Text style={styles.elapsedTime}>Running for {calculateElapsedTime()}</Text>
          </View>
        </View>

        {/* GPS Location */}
        {trip.latitude && trip.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <MapPin size={20} color="#DC2626" />
                <Text style={styles.locationTitle}>Live GPS Position</Text>
                <View style={styles.liveDot} />
              </View>
              
              <Text style={styles.addressText}>
                {trip.address || 'Address not available'}
              </Text>
              
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>
                    {trip.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>
                    {trip.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.mapButton}>
                <Navigation size={16} color="#FFFFFF" />
                <Text style={styles.mapButtonText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trip Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Route</Text>
          <View style={styles.routeCard}>
            <View style={styles.routePoint}>
              <MapPin size={16} color="#10B981" />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeLocation}>{trip.start_location}</Text>
                <Text style={styles.routeTime}>
                  {formatDate(trip.start_time)} • {formatTime(trip.start_time)}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <MapPin size={16} color="#EF4444" />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeLocation}>{trip.end_location}</Text>
                <Text style={styles.routeTime}>Expected arrival</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <User size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Driver ID</Text>
              <Text style={styles.infoValue}>{trip.driver_username || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Driver Name</Text>
              <Text style={styles.infoValue}>John Doe</Text>
            </View>
            <View style={styles.infoItem}>
              <Truck size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Vehicle ID</Text>
              <Text style={styles.infoValue}>{trip.vehicle_id || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Vehicle Name</Text>
              <Text style={styles.infoValue}>Bus TN-01-AB-1234</Text>
            </View>
          </View>
        </View>

        {/* Real-time Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-time Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Gauge size={24} color="#3B82F6" />
              <Text style={styles.metricLabel}>Current Speed</Text>
              <Text style={styles.metricValue}>45 km/h</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Navigation size={24} color="#10B981" />
              <Text style={styles.metricLabel}>Distance Covered</Text>
              <Text style={styles.metricValue}>
                {trip.distance_travelled ? `${trip.distance_travelled} km` : '0 km'}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <Timer size={24} color="#F59E0B" />
              <Text style={styles.metricLabel}>Avg Speed</Text>
              <Text style={styles.metricValue}>
                {trip.average_speed ? `${trip.average_speed} km/h` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <Gauge size={24} color="#EF4444" />
              <Text style={styles.metricLabel}>Max Speed</Text>
              <Text style={styles.metricValue}>
                {trip.max_speed ? `${trip.max_speed} km/h` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>IN PROGRESS</Text>
              </View>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Harsh Events</Text>
              <Text style={styles.progressValue}>{trip.harsh_events_count || 0}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Fuel Consumed</Text>
              <Text style={styles.progressValue}>
                {trip.fuel_consumed ? `${trip.fuel_consumed} L` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  liveStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  liveText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tripId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  elapsedTime: {
    fontSize: 16,
    color: '#6B7280',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  addressText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 24,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  coordinateItem: {
    flex: 1,
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  mapButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  routeLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#DC2626',
    marginLeft: 7,
    marginVertical: 8,
  },
  infoGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
  },
});