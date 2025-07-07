import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bus as BusType } from '@/types';
import { Clock, MapPin, Star, Users, Zap, Shield } from 'lucide-react-native';

interface BusCardProps {
  bus: BusType;
  onPress: () => void;
}

export default function BusCard({ bus, onPress }: BusCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AC': return '#10B981';
      case 'Volvo': return '#8B5CF6';
      case 'Deluxe': return '#F59E0B';
      case 'Express': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AC': return <Zap size={16} color="#10B981" />;
      case 'Volvo': return <Shield size={16} color="#8B5CF6" />;
      default: return null;
    }
  };

  const getOperatorColor = (operator: string) => {
    switch (operator) {
      case 'TNSTC': return '#DC2626';
      case 'SETC': return '#059669';
      case 'MTC': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.busInfo}>
          <Text style={styles.busName}>{bus.name}</Text>
          <Text style={styles.busNumber}>{bus.number}</Text>
          <View style={styles.operatorBadge}>
            <Text style={[styles.operatorText, { color: getOperatorColor(bus.operator) }]}>
              {bus.operator}
            </Text>
          </View>
        </View>
        <View style={styles.rating}>
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{bus.rating}</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{bus.departure}</Text>
          <Text style={styles.city}>{bus.route.from}</Text>
        </View>
        
        <View style={styles.duration}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.durationText}>{bus.duration}</Text>
          <View style={styles.routeLine} />
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{bus.arrival}</Text>
          <Text style={styles.city}>{bus.route.to}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.typeContainer}>
          {getTypeIcon(bus.type)}
          <Text style={[styles.type, { color: getTypeColor(bus.type) }]}>
            {bus.type}
          </Text>
        </View>
        
        <View style={styles.seatsContainer}>
          <Users size={16} color="#6B7280" />
          <Text style={[
            styles.seats,
            bus.availableSeats === 0 ? styles.noSeats : 
            bus.availableSeats < 10 ? styles.fewSeats : styles.availableSeats
          ]}>
            {bus.availableSeats === 0 ? 'Sold Out' : `${bus.availableSeats} seats`}
          </Text>
        </View>
        
        <Text style={styles.fare}>₹{bus.fare}</Text>
      </View>

      <View style={styles.amenities}>
        {bus.amenities.slice(0, 3).map((amenity, index) => (
          <View key={index} style={styles.amenity}>
            <Text style={styles.amenityText}>{amenity}</Text>
          </View>
        ))}
        {bus.amenities.length > 3 && (
          <Text style={styles.moreAmenities}>+{bus.amenities.length - 3} more</Text>
        )}
      </View>

      {bus.availableSeats === 0 && (
        <View style={styles.waitlistBanner}>
          <Text style={styles.waitlistText}>Join Waiting List</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  busNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  operatorBadge: {
    alignSelf: 'flex-start',
  },
  operatorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeContainer: {
    alignItems: 'center',
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  city: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  duration: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'relative',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeLine: {
    position: 'absolute',
    top: '50%',
    left: -30,
    right: -30,
    height: 2,
    backgroundColor: '#DC2626',
    zIndex: -1,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seats: {
    marginLeft: 4,
    fontSize: 14,
  },
  availableSeats: {
    color: '#10B981',
    fontWeight: '600',
  },
  fewSeats: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  noSeats: {
    color: '#EF4444',
    fontWeight: '600',
  },
  fare: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amenity: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  waitlistBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  waitlistText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});