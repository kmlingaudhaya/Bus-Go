import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import BusCard from '@/components/BusCard';
import { mockBuses, mockNotifications } from '@/data/mockData';
import { Bus as BusType } from '@/types';
import { Calendar, Clock, MapPin, Users, Star, TrendingUp, Bus as BusIcon } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const [from, setFrom] = useState('Chennai');
  const [to, setTo] = useState('Madurai');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredBuses, setFilteredBuses] = useState<BusType[]>([]);

  const unreadNotifications = mockNotifications.filter(n => !n.read && n.userId === user?.id).length;

  useEffect(() => {
    // Filter buses based on search criteria
    const filtered = mockBuses.filter(bus => 
      bus.route.from === from && bus.route.to === to
    );
    setFilteredBuses(filtered);
  }, [from, to, user]);

  const handleSwapCities = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleBusPress = (bus: BusType) => {
    router.push({
      pathname: '/booking',
      params: { busId: bus.id }
    });
  };

  return (
    <View style={styles.container}>
      <Navbar title="TNSTC Bus Booking" notificationCount={unreadNotifications} />
      
      <ScrollView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Tamil Nadu State Transport</Text>
            <Text style={styles.heroSubtitle}>Safe, Reliable & Affordable Travel</Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.welcomeSubtext}>Book your journey across Tamil Nadu</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <BusIcon size={24} color="#DC2626" />
            <Text style={styles.statValue}>2,500+</Text>
            <Text style={styles.statLabel}>Daily Services</Text>
          </View>
          <View style={styles.statCard}>
            <MapPin size={24} color="#DC2626" />
            <Text style={styles.statValue}>500+</Text>
            <Text style={styles.statLabel}>Destinations</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color="#DC2626" />
            <Text style={styles.statValue}>4.2</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Search Section */}
        <SearchBar
          from={from}
          to={to}
          date={selectedDate}
          onFromChange={setFrom}
          onToChange={setTo}
          onDateChange={setSelectedDate}
          onSwap={handleSwapCities}
        />

        {/* Popular Routes */}
        <View style={styles.popularRoutes}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.routeCard}>
              <Text style={styles.routeText}>Chennai → Madurai</Text>
              <Text style={styles.routePrice}>From ₹280</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routeCard}>
              <Text style={styles.routeText}>Chennai → Coimbatore</Text>
              <Text style={styles.routePrice}>From ₹320</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routeCard}>
              <Text style={styles.routeText}>Madurai → Tirunelveli</Text>
              <Text style={styles.routePrice}>From ₹120</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Available Buses */}
        <View style={styles.busListHeader}>
          <Text style={styles.busListTitle}>
            Available Buses ({filteredBuses.length})
          </Text>
          <Text style={styles.busListSubtitle}>
            {from} to {to} • {selectedDate.toLocaleDateString('en-IN')}
          </Text>
        </View>

        <FlatList
          data={filteredBuses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusCard bus={item} onPress={() => handleBusPress(item)} />
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BusIcon size={48} color="#DC2626" />
              <Text style={styles.emptyText}>No buses found</Text>
              <Text style={styles.emptySubtext}>
                Try selecting different cities or dates
              </Text>
            </View>
          }
        />

        {/* Government Notice */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>Government Notice</Text>
          <Text style={styles.noticeText}>
            All passengers must carry valid ID proof during travel. 
            Senior citizens and students are eligible for special discounts.
          </Text>
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
  heroSection: {
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FEF2F2',
    textAlign: 'center',
    marginTop: 8,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  popularRoutes: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  busListHeader: {
    padding: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  busListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  busListSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 20,
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
  noticeSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
});