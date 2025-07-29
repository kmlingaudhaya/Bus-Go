import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { mockBookings } from '@/data/mockData';
import { Booking } from '@/types';
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';

export default function TrackingScreen() {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Get active bookings for current user
    const userBookings = mockBookings.filter(
      (booking) => String(booking.userId) === String(user?.user_id) && booking.status === 'confirmed'
    );
    setActiveBookings(userBookings);
    if (userBookings.length > 0) {
      setSelectedBooking(userBookings[0]);
    }
  }, [user]);

  if (user?.role !== 'passenger') {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Access Denied</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            This section is only available for passengers
          </Text>
        </View>
      </View>
    );
  }

  if (activeBookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Trip Tracking</Text>
          <Text style={styles.subtitle}>Live bus location</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MapPin size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No active trips</Text>
          <Text style={styles.emptySubtext}>
            Book a ticket to track your journey in real-time
          </Text>
        </View>
      </View>
    );
  }

  const mockLocation = {
    latitude: 11.0168,
    longitude: 76.9558,
    city: 'Coimbatore',
    estimatedArrival: '2h 30m',
    speed: '65 km/h',
    nextStop: 'Salem',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Trip Tracking</Text>
        <Text style={styles.subtitle}>Live bus location</Text>
      </View>

      {/* Trip Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Trips</Text>
        <View style={styles.card}>
          {activeBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={[
                styles.tripOption,
                selectedBooking?.id === booking.id && styles.selectedTrip,
              ]}
              onPress={() => setSelectedBooking(booking)}
            >
              <Text style={styles.tripRoute}>Chennai → Madurai</Text>
              <Text style={styles.tripPnr}>PNR: {booking.pnr}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Location</Text>
        <View style={styles.card}>
          <View style={styles.mapPlaceholder}>
            <MapPin size={32} color="#2563EB" />
            <Text style={styles.mapText}>Live Bus Location</Text>
            <Text style={styles.mapSubtext}>Map integration coming soon</Text>
          </View>
        </View>
      </View>

      {/* Trip Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Status</Text>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Navigation size={16} color="#059669" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Current Location</Text>
              <Text style={styles.statusValue}>{mockLocation.city}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Clock size={16} color="#EA580C" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Estimated Arrival</Text>
              <Text style={styles.statusValue}>
                {mockLocation.estimatedArrival}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <MapPin size={16} color="#7C3AED" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Next Stop</Text>
              <Text style={styles.statusValue}>{mockLocation.nextStop}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <AlertCircle size={16} color="#2563EB" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Speed</Text>
              <Text style={styles.statusValue}>{mockLocation.speed}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.emergencyText}>Call Conductor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Journey Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Journey Progress</Text>
        <View style={styles.card}>
          <View style={styles.progressStops}>
            <View style={[styles.progressStop, styles.completedStop]}>
              <Text style={styles.stopTime}>06:00</Text>
              <Text style={styles.stopName}>Chennai</Text>
            </View>
            <View style={[styles.progressStop, styles.completedStop]}>
              <Text style={styles.stopTime}>08:30</Text>
              <Text style={styles.stopName}>Villupuram</Text>
            </View>
            <View style={[styles.progressStop, styles.currentStop]}>
              <Text style={styles.stopTime}>11:00</Text>
              <Text style={styles.stopName}>Trichy</Text>
            </View>
            <View style={styles.progressStop}>
              <Text style={styles.stopTime}>13:30</Text>
              <Text style={styles.stopName}>Dindigul</Text>
            </View>
            <View style={styles.progressStop}>
              <Text style={styles.stopTime}>14:30</Text>
              <Text style={styles.stopName}>Madurai</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
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
    marginBottom: 0,
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tripOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTrip: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tripPnr: {
    fontSize: 14,
    color: '#64748B',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
  },
  emergencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressStops: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStop: {
    alignItems: 'center',
    flex: 1,
  },
  completedStop: {
    opacity: 0.6,
  },
  currentStop: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    margin: -8,
  },
  stopTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stopName: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
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
