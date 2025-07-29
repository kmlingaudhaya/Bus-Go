import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import BusCard from '@/components/BusCard';
import { mockBuses, mockNotifications } from '@/data/mockData';
import { Bus as BusType, Notification } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  TrendingUp,
  Bus as BusIcon,
  ArrowRight,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  // Use mockBuses and mockNotifications directly as arrays
  const [from, setFrom] = useState('chennai');
  const [to, setTo] = useState('madurai');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredBuses, setFilteredBuses] = useState<BusType[]>([]);

  // Example filter options for routes
  const routeOptions = [
    {
      key: 'chennai-madurai',
      from: 'chennai',
      to: 'madurai',
      label: `${t('city_chennai')} → ${t('city_madurai')}`,
    },
    {
      key: 'chennai-coimbatore',
      from: 'chennai',
      to: 'coimbatore',
      label: `${t('city_chennai')} → ${t('city_coimbatore')}`,
    },
    {
      key: 'madurai-tirunelveli',
      from: 'madurai',
      to: 'tirunelveli',
      label: `${t('city_madurai')} → ${t('city_tirunelveli')}`,
    },
  ];

  // Helper to safely get user id and name
  const userId =
    user && typeof user === 'object' && 'id' in user
      ? (user as any).id
      : undefined;
  const userName =
    user && typeof user === 'object' && 'name' in user
      ? (user as any).name
      : '';

  const unreadNotifications =
    Array.isArray(mockNotifications) && userId
      ? (mockNotifications as Notification[]).filter(
          (n) => !n.read && n.userId === userId
        ).length
      : 0;

  useEffect(() => {
    if (!Array.isArray(mockBuses)) {
      setFilteredBuses([]);
      return;
    }
    const filtered = (mockBuses as BusType[]).filter(
      (bus) => bus.route.from === from && bus.route.to === to
    );
    setFilteredBuses(filtered);
  }, [from, to, userId]);

  const handleSwapCities = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleBusPress = (bus: BusType) => {
    // TODO: Replace '/(tabs)' with the correct booking route if available in your router config
    router.push({
      pathname: '/(tabs)',
      params: { busId: bus.id },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t('app_name') || 'TNSTC Bus Booking'}</Text>
        <Text style={styles.subtitle}>
          {t('welcome_subtext') || 'Book your journey across Tamil Nadu'}
        </Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <TrendingUp size={16} color="#6B7280" />
          <Text style={styles.filtersTitle}>Popular Routes</Text>
        </View>
        <View style={styles.filtersGrid}>
          {routeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                from === option.from && to === option.to && styles.selectedFilterButton,
              ]}
              onPress={() => {
                setFrom(option.from);
                setTo(option.to);
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  from === option.from && to === option.to && styles.selectedFilterButtonText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bus List */}
      <FlatList
        data={filteredBuses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleBusPress(item)}>
            {/* Bus Info */}
            <View style={styles.routeContainer}>
              <View style={styles.locationContainer}>
                <View style={styles.locationHeader}>
                  <MapPin size={16} color="#10B981" />
                  <Text style={styles.locationLabel}>From</Text>
                </View>
                <Text style={styles.locationName}>{item.route.from}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <ArrowRight size={24} color="#DC2626" />
              </View>
              <View style={styles.locationContainer}>
                <View style={styles.locationHeader}>
                  <MapPin size={16} color="#EF4444" />
                  <Text style={styles.locationLabel}>To</Text>
                </View>
                <Text style={styles.locationName}>{item.route.to}</Text>
              </View>
            </View>
            {/* Bus Details */}
            <View style={styles.tripDetailsContainer}>
              <View style={styles.tripDetailItem}>
                <Text style={styles.tripDetailLabel}>Bus</Text>
                <Text style={styles.tripDetailValue}>{item.name}</Text>
              </View>
              <View style={styles.tripDetailItem}>
                <Text style={styles.tripDetailLabel}>Type</Text>
                <Text style={styles.tripDetailValue}>{item.type}</Text>
              </View>
              <View style={styles.tripDetailItem}>
                <Text style={styles.tripDetailLabel}>Seats</Text>
                <Text style={styles.tripDetailValue}>{item.seats}</Text>
              </View>
              <View style={styles.tripDetailItem}>
                <Text style={styles.tripDetailLabel}>Fare</Text>
                <Text style={styles.tripDetailValue}>₹{item.fare}</Text>
              </View>
            </View>
            {/* Tap to View Details Indicator */}
            <View style={styles.tapIndicator}>
              <Text style={styles.tapText}>Tap to view details</Text>
              <ArrowRight size={16} color="#DC2626" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BusIcon size={48} color="#DC2626" />
            <Text style={styles.emptyText}>
              {t('no_buses_found') || 'No buses found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('try_different_cities_dates') ||
                'Try selecting different cities or dates'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// Add/modify styles below to match trips.tsx look
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationContainer: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  arrowContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tripDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tripDetailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minHeight: 50,
    justifyContent: 'center',
  },
  tripDetailLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tripDetailValue: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tapText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
