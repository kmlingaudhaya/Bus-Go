import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { mockTrips, mockNotifications } from '@/data/mockData';
import { Trip } from '@/types';
import { Clock, MapPin, Users, CircleCheck as CheckCircle, Circle as XCircle, Play, Bus } from 'lucide-react-native';

export default function ConductorTripsScreen() {
  const { user } = useAuth();
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const unreadNotifications = mockNotifications.filter(n => !n.read && n.userId === user?.id).length;

  useEffect(() => {
    // Get assigned trips for conductor
    const trips = mockTrips.filter(trip => trip.conductorId === user?.id);
    setAssignedTrips(trips);
  }, [user]);

  const handleTripAction = (trip: Trip, action: 'accept' | 'decline' | 'start') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Update trip status
            setAssignedTrips(prev =>
              prev.map(t =>
                t.id === trip.id
                  ? { ...t, status: action === 'accept' ? 'accepted' : action === 'start' ? 'started' : 'cancelled' }
                  : t
              )
            );
            Alert.alert('Success', `Trip ${action}ed successfully`);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'started': return '#3B82F6';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#FEF3C7';
      case 'accepted': return '#D1FAE5';
      case 'started': return '#DBEAFE';
      case 'completed': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  return (
    <View style={styles.container}>
      <Navbar title="My Trips" notificationCount={unreadNotifications} />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.conductorName}>{user?.name}</Text>
          <Text style={styles.employeeId}>Employee ID: {user?.employeeId}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{assignedTrips.filter(t => t.status === 'assigned').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{assignedTrips.filter(t => t.status === 'accepted').length}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{assignedTrips.filter(t => t.status === 'started').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Trips</Text>
          
          {assignedTrips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bus size={48} color="#DC2626" />
              <Text style={styles.emptyText}>No trips assigned</Text>
              <Text style={styles.emptySubtext}>Check back later for new assignments</Text>
            </View>
          ) : (
            assignedTrips.map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.tripRoute}>
                      {trip.route.from} → {trip.route.to}
                    </Text>
                    <Text style={styles.vehicleNumber}>{trip.vehicleNumber}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(trip.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(trip.status) }
                    ]}>
                      {trip.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tripDetails}>
                  <View style={styles.tripDetailRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.tripDetailText}>
                      Departure: {trip.scheduledDeparture.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.tripDetailRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.tripDetailText}>
                      Distance: {trip.route.distance}
                    </Text>
                  </View>
                  <View style={styles.tripDetailRow}>
                    <Users size={16} color="#6B7280" />
                    <Text style={styles.tripDetailText}>
                      Depot: {trip.depotCode}
                    </Text>
                  </View>
                </View>

                <View style={styles.tripActions}>
                  {trip.status === 'assigned' && (
                    <>
                      <TouchableOpacity
                        style={[styles.tripButton, styles.acceptButton]}
                        onPress={() => handleTripAction(trip, 'accept')}
                      >
                        <CheckCircle size={16} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tripButton, styles.declineButton]}
                        onPress={() => handleTripAction(trip, 'decline')}
                      >
                        <XCircle size={16} color="#DC2626" />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {trip.status === 'accepted' && (
                    <TouchableOpacity
                      style={[styles.tripButton, styles.startButton]}
                      onPress={() => handleTripAction(trip, 'start')}
                    >
                      <Play size={16} color="#FFFFFF" />
                      <Text style={styles.startButtonText}>Start Trip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
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
  conductorName: {
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
  acceptButtonText: {
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
});