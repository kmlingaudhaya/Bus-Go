import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Booking } from '@/types';
import { Calendar, Clock, MapPin, Users, Ticket } from 'lucide-react-native';

interface TicketCardProps {
  booking: Booking;
  onPress?: () => void;
}

export default function TicketCard({ booking, onPress }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'cancelled': return '#DC2626';
      case 'completed': return '#64748B';
      default: return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#ECFDF5';
      case 'cancelled': return '#FEF2F2';
      case 'completed': return '#F8FAFC';
      default: return '#F8FAFC';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.ticketInfo}>
          <Text style={styles.pnr}>PNR: {booking.pnr}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(booking.status) }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(booking.status) }
            ]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.qrContainer}>
          <QRCode
            value={booking.qrCode}
            size={80}
            backgroundColor="transparent"
          />
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routePoint}>
          <MapPin size={16} color="#2563EB" />
          <Text style={styles.routeText}>From</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <MapPin size={16} color="#2563EB" />
          <Text style={styles.routeText}>To</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.detailLabel}>Journey Date</Text>
          <Text style={styles.detailValue}>
            {booking.journeyDate.toLocaleDateString('en-IN')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Users size={16} color="#64748B" />
          <Text style={styles.detailLabel}>Passengers</Text>
          <Text style={styles.detailValue}>
            {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ticket size={16} color="#64748B" />
          <Text style={styles.detailLabel}>Seats</Text>
          <Text style={styles.detailValue}>
            {booking.seatNumbers.join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹{booking.totalFare}</Text>
        </View>
        <View style={styles.passengersList}>
          {booking.passengers.map((passenger, index) => (
            <Text key={index} style={styles.passengerName}>
              {passenger.name} ({passenger.age}Y, {passenger.gender})
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketInfo: {
    flex: 1,
  },
  pnr: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#64748B',
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },
  passengersList: {
    marginTop: 8,
  },
  passengerName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
});