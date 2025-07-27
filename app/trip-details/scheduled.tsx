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
  Timer,
  AlertCircle,
} from 'lucide-react-native';
import { Trip } from '@/services/api';

export default function ScheduledTripDetailsScreen() {
  const { trip: tripParam } = useLocalSearchParams();
  const trip: Trip = JSON.parse(decodeURIComponent(tripParam as string));

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

  const getTimeUntilStart = () => {
    const start = new Date(trip.start_time);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Starting soon';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateEstimatedDuration = () => {
    if (!trip.end_time) return 'N/A';
    const start = new Date(trip.start_time);
    const end = new Date(trip.end_time);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Trip</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>SCHEDULED</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Overview</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.tripId}>Trip #{trip.trip_id}</Text>
            <View style={styles.countdownContainer}>
              <Timer size={20} color="#10B981" />
              <Text style={styles.countdownLabel}>Starts in</Text>
              <Text style={styles.countdownValue}>{getTimeUntilStart()}</Text>
            </View>
            <View style={styles.routeContainer}>
              <View style={styles.locationPoint}>
                <MapPin size={16} color="#10B981" />
                <Text style={styles.locationText}>{trip.start_location}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.locationPoint}>
                <MapPin size={16} color="#EF4444" />
                <Text style={styles.locationText}>{trip.end_location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Details</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleHeader}>
                <Calendar size={16} color="#10B981" />
                <Text style={styles.scheduleLabel}>Departure</Text>
              </View>
              <Text style={styles.scheduleDate}>{formatDate(trip.start_time)}</Text>
              <Text style={styles.scheduleTime}>{formatTime(trip.start_time)}</Text>
            </View>
            
            <View style={styles.scheduleDivider} />
            
            {trip.end_time && (
              <>
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <Calendar size={16} color="#EF4444" />
                    <Text style={styles.scheduleLabel}>Arrival</Text>
                  </View>
                  <Text style={styles.scheduleDate}>{formatDate(trip.end_time)}</Text>
                  <Text style={styles.scheduleTime}>{formatTime(trip.end_time)}</Text>
                </View>
                
                <View style={styles.scheduleDivider} />
              </>
            )}
            
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleHeader}>
                <Timer size={16} color="#3B82F6" />
                <Text style={styles.scheduleLabel}>Duration</Text>
              </View>
              <Text style={styles.scheduleTime}>{calculateEstimatedDuration()}</Text>
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

        {/* Route Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          <View style={styles.routeInfoCard}>
            <View style={styles.routeDetail}>
              <Route size={20} color="#3B82F6" />
              <View style={styles.routeDetailInfo}>
                <Text style={styles.routeDetailLabel}>Estimated Distance</Text>
                <Text style={styles.routeDetailValue}>
                  {trip.distance_travelled ? `${trip.distance_travelled} km` : 'To be calculated'}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeDetail}>
              <MapPin size={20} color="#10B981" />
              <View style={styles.routeDetailInfo}>
                <Text style={styles.routeDetailLabel}>Starting Point</Text>
                <Text style={styles.routeDetailValue}>{trip.start_location}</Text>
                <Text style={styles.routeDetailTime}>
                  {formatDate(trip.start_time)} at {formatTime(trip.start_time)}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeDetail}>
              <MapPin size={20} color="#EF4444" />
              <View style={styles.routeDetailInfo}>
                <Text style={styles.routeDetailLabel}>Destination</Text>
                <Text style={styles.routeDetailValue}>{trip.end_location}</Text>
                {trip.end_time && (
                  <Text style={styles.routeDetailTime}>
                    Expected: {formatDate(trip.end_time)} at {formatTime(trip.end_time)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Pre-trip Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pre-trip Checklist</Text>
          <View style={styles.checklistCard}>
            <View style={styles.checklistItem}>
              <View style={styles.checkboxUnchecked} />
              <Text style={styles.checklistText}>Vehicle inspection completed</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkboxUnchecked} />
              <Text style={styles.checklistText}>Driver briefing completed</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkboxUnchecked} />
              <Text style={styles.checklistText}>Route confirmed</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkboxUnchecked} />
              <Text style={styles.checklistText}>Fuel level checked</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkboxUnchecked} />
              <Text style={styles.checklistText}>Emergency contacts verified</Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <View style={styles.notesCard}>
            <View style={styles.noteItem}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.noteText}>
                Ensure driver arrives 30 minutes before departure time
              </Text>
            </View>
            <View style={styles.noteItem}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.noteText}>
                Weather conditions to be monitored for this route
              </Text>
            </View>
            <View style={styles.noteItem}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.noteText}>
                Contact dispatch if any delays are expected
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
    backgroundColor: '#10B981',
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
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
    marginRight: 8,
  },
  countdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
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
    backgroundColor: '#10B981',
    marginVertical: 4,
  },
  scheduleCard: {
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
  scheduleItem: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  scheduleDate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  scheduleDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
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
  routeInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeDetailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  routeDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  routeDetailTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkboxUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  checklistText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});