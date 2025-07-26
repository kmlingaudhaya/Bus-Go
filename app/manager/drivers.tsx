import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface Driver {
  id: string;
  name: string;
  username: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  bloodGroup: string;
  address: string;
  status: 'active' | 'inactive' | 'on_trip';
  rating: number;
  totalTrips: number;
  joinDate: Date;
}

export default function ManagerDriversScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock drivers data
  const mockDrivers: Driver[] = [
    {
      id: '1',
      name: 'Ravi Kumar',
      username: 'ravi_kumar',
      phone: '+91 98765 43210',
      licenseNumber: 'TN-01-20230001',
      licenseExpiry: new Date('2025-12-31'),
      bloodGroup: 'O+',
      address: '123 Anna Nagar, Chennai',
      status: 'on_trip',
      rating: 4.8,
      totalTrips: 245,
      joinDate: new Date('2022-01-15'),
    },
    {
      id: '2',
      name: 'Suresh Babu',
      username: 'suresh_babu',
      phone: '+91 87654 32109',
      licenseNumber: 'TN-01-20230002',
      licenseExpiry: new Date('2024-08-15'),
      bloodGroup: 'A+',
      address: '456 T. Nagar, Chennai',
      status: 'active',
      rating: 4.6,
      totalTrips: 189,
      joinDate: new Date('2022-03-20'),
    },
    {
      id: '3',
      name: 'Muthu Raja',
      username: 'muthu_raja',
      phone: '+91 76543 21098',
      licenseNumber: 'TN-01-20230003',
      licenseExpiry: new Date('2026-02-28'),
      bloodGroup: 'B+',
      address: '789 Velachery, Chennai',
      status: 'inactive',
      rating: 4.4,
      totalTrips: 156,
      joinDate: new Date('2022-06-10'),
    },
  ];

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [searchQuery, drivers]);

  const loadDrivers = () => {
    // In a real app, this would fetch from an API
    setDrivers(mockDrivers);
  };

  const filterDrivers = () => {
    if (!searchQuery.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        driver =>
          driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    loadDrivers();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'on_trip':
        return '#3B82F6';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#D1FAE5';
      case 'on_trip':
        return '#DBEAFE';
      case 'inactive':
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  const isLicenseExpiringSoon = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isLicenseExpired = (expiryDate: Date) => {
    return expiryDate < new Date();
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{item.name}</Text>
            <Text style={styles.driverUsername}>@{item.username}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {item.rating}</Text>
              <Text style={styles.trips}>• {item.totalTrips} trips</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(item.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Edit size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.driverMetrics}>
        <View style={styles.metricRow}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.metricText}>{item.phone}</Text>
        </View>

        <View style={styles.metricRow}>
          <CreditCard size={16} color="#6B7280" />
          <Text style={styles.metricText}>{item.licenseNumber}</Text>
          {isLicenseExpired(item.licenseExpiry) && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>EXPIRED</Text>
            </View>
          )}
          {isLicenseExpiringSoon(item.licenseExpiry) && !isLicenseExpired(item.licenseExpiry) && (
            <View style={styles.warnBadge}>
              <Text style={styles.warnText}>EXPIRING SOON</Text>
            </View>
          )}
        </View>

        <View style={styles.metricRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.metricText}>
            Expires: {item.licenseExpiry.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Heart size={16} color="#DC2626" />
          <Text style={styles.metricText}>Blood Group: {item.bloodGroup}</Text>
        </View>

        <View style={styles.metricRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.metricText} numberOfLines={2}>
            {item.address}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.metricText}>
            Joined: {item.joinDate.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('drivers') || 'Drivers'}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_drivers') || 'Search drivers...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {drivers.filter(d => d.status === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {drivers.filter(d => d.status === 'on_trip').length}
          </Text>
          <Text style={styles.summaryLabel}>On Trip</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {drivers.filter(d => isLicenseExpiringSoon(d.licenseExpiry) || isLicenseExpired(d.licenseExpiry)).length}
          </Text>
          <Text style={styles.summaryLabel}>License Issues</Text>
        </View>
      </View>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? t('no_drivers_found') || 'No drivers found'
                : t('no_drivers') || 'No drivers available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
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
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  driverUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  trips: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});