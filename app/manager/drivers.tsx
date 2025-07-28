import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDriversByManager, Driver } from '@/services/api';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Heart,
  Search,
  Plus,
  Edit,
} from 'lucide-react-native';

export default function ManagerDriversScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    if (!user?.username) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getDriversByManager(user.username);
      setDrivers(data);
      setFilteredDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
      Alert.alert('Error', 'Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [user?.username]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.phone.includes(searchQuery) ||
          driver.license_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchQuery, drivers]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDrivers}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (filteredDrivers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery ? 'No drivers found matching your search' : 'No drivers found'}
        </Text>
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear search</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderDriverItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <User size={24} color="#4B5563" />
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.name}</Text>
          <Text style={styles.driverUsername}>@{item.username}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'active' && styles.statusActive,
            item.status === 'inactive' && styles.statusInactive,
            item.status === 'on_trip' && styles.statusOnTrip,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === 'on_trip' ? 'On Trip' : item.status}
          </Text>
        </View>
      </View>

      <View style={styles.driverDetails}>
        <View style={styles.detailRow}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <CreditCard size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.license_number}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.driverFooter}>
        <View style={styles.ratingContainer}>
          <Heart size={16} color="#EF4444" fill="#EF4444" />
          <Text style={styles.ratingText}>{item.rating?.toFixed(1) || 'N/A'}</Text>
        </View>
        <Text style={styles.tripsText}>{item.total_trips || 0} trips</Text>
        <Text style={styles.joinDate}>
          {item.join_date ? `Joined ${new Date(item.join_date).toLocaleDateString()}` : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Drivers</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Driver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or license..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredDrivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No drivers found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  clearSearchText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 8,
    color: '#111827',
    fontSize: 16,
    paddingRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyListText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  driverUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
    minWidth: 70,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#34C759',
    padding: 8,
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusOnTrip: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  driverDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
    flex: 1,
  },
  driverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },

  emptySearchText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  driverMetrics: {
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  warnBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  warnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  tripsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});