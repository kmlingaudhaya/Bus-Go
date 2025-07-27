import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Truck,
  Route,
  Fuel,
  Gauge,
  Timer,
} from 'lucide-react-native';

export default function CompletedTripDetailsScreen() {
  const { trip: tripParam } = useLocalSearchParams();
  
  let trip;
  try {
    trip = JSON.parse(decodeURIComponent(tripParam as string));
  } catch (error) {
    console.error('Error parsing trip data:', error);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load trip details</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Time';
    }
  };

  const calculateDuration = () => {
    if (!trip.end_time) return 'N/A';
    try {
      const start = new Date(trip.start_time);
      const end = new Date(trip.end_time);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>COMPLETED</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Overview</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.tripId}>Trip #{trip.trip_id || 'N/A'}</Text>
            <View style={styles.routeContainer}>
              <View style={styles.locationPoint}>
                <MapPin size={16} color="#10B981" />
                <Text style={styles.locationText}>{trip.start_location || 'N/A'}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.locationPoint}>
                <MapPin size={16} color="#EF4444" />
                <Text style={styles.locationText}>{trip.end_location || 'N/A'}</Text>
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

        {/* Time Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Details</Text>
          <View style={styles.timeCard}>
            <View style={styles.timeItem}>
              <View style={styles.timeHeader}>
                <Calendar size={16} color="#10B981" />
                <Text style={styles.timeLabel}>Start</Text>
              </View>
              <Text style={styles.timeDate}>{trip.start_time ? formatDate(trip.start_time) : 'N/A'}</Text>
              <Text style={styles.timeValue}>{trip.start_time ? formatTime(trip.start_time) : 'N/A'}</Text>
            </View>
            
            <View style={styles.timeDivider} />
            
            <View style={styles.timeItem}>
              <View style={styles.timeHeader}>
                <Calendar size={16} color="#EF4444" />
                <Text style={styles.timeLabel}>End</Text>
              </View>
              <Text style={styles.timeDate}>
                {trip.end_time ? formatDate(trip.end_time) : 'N/A'}
              </Text>
              <Text style={styles.timeValue}>
                {trip.end_time ? formatTime(trip.end_time) : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.timeDivider} />
            
            <View style={styles.timeItem}>
              <View style={styles.timeHeader}>
                <Timer size={16} color="#3B82F6" />
                <Text style={styles.timeLabel}>Duration</Text>
              </View>
              <Text style={styles.timeValue}>{calculateDuration()}</Text>
            </View>
          </View>
        </View>

        {/* Trip Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Analytics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Route size={24} color="#3B82F6" />
              <Text style={styles.analyticsLabel}>Distance</Text>
              <Text style={styles.analyticsValue}>
                {trip.distance_travelled ? `${trip.distance_travelled} km` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.analyticsCard}>
              <Gauge size={24} color="#10B981" />
              <Text style={styles.analyticsLabel}>Avg Speed</Text>
              <Text style={styles.analyticsValue}>
                {trip.average_speed ? `${trip.average_speed} km/h` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.analyticsCard}>
              <Gauge size={24} color="#F59E0B" />
              <Text style={styles.analyticsLabel}>Max Speed</Text>
              <Text style={styles.analyticsValue}>
                {trip.max_speed ? `${trip.max_speed} km/h` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.analyticsCard}>
              <Fuel size={24} color="#EF4444" />
              <Text style={styles.analyticsLabel}>Fuel Used</Text>
              <Text style={styles.analyticsValue}>
                {trip.fuel_consumed ? `${trip.fuel_consumed} L` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Harsh Events</Text>
              <Text style={styles.metricValue}>
                {trip.harsh_events_count || 0}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Safety Score</Text>
              <Text style={[styles.metricValue, styles.safetyScore]}>95%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Efficiency Rating</Text>
              <Text style={[styles.metricValue, styles.efficiencyRating]}>A+</Text>
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
    backgroundColor: '#DC2626',
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
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  routeContainer: {
    alignItems: 'center',
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#DC2626',
    marginVertical: 4,
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
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  timeDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  timeDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
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
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  safetyScore: {
    color: '#10B981',
  },
  efficiencyRating: {
    color: '#3B82F6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonError: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});