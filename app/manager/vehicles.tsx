import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Truck,
  MapPin,
  Clock,
  Fuel,
  Settings,
  Plus,
} from 'lucide-react-native';

interface Vehicle {
  id: string;
  number: string;
  type: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  driver?: string;
  lastMaintenance: Date;
  fuelLevel: number;
  mileage: number;
}

export default function ManagerVehiclesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock vehicles data
  const mockVehicles: Vehicle[] = [
    {
      id: '1',
      number: 'TN-01-AB-1234',
      type: 'Bus',
      status: 'active',
      location: 'Chennai Central',
      driver: 'Ravi Kumar',
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      fuelLevel: 75,
      mileage: 45000,
    },
    {
      id: '2',
      number: 'TN-01-CD-5678',
      type: 'Bus',
      status: 'maintenance',
      location: 'Depot A',
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      fuelLevel: 20,
      mileage: 52000,
    },
    {
      id: '3',
      number: 'TN-01-EF-9012',
      type: 'Bus',
      status: 'active',
      location: 'Coimbatore',
      driver: 'Suresh Babu',
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      fuelLevel: 90,
      mileage: 38000,
    },
    {
      id: '4',
      number: 'TN-01-GH-3456',
      type: 'Bus',
      status: 'inactive',
      location: 'Depot B',
      lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      fuelLevel: 10,
      mileage: 65000,
    },
  ];

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    // In a real app, this would fetch from an API
    setVehicles(mockVehicles);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    loadVehicles();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'maintenance':
        return '#F59E0B';
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
      case 'maintenance':
        return '#FEF3C7';
      case 'inactive':
        return '#F3F4F6';
      default:
        return '#F3F4F6';
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level > 50) return '#10B981';
    if (level > 25) return '#F59E0B';
    return '#DC2626';
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Truck size={24} color="#DC2626" />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleNumber}>{item.number}</Text>
            <Text style={styles.vehicleType}>{item.type}</Text>
          </View>
        </View>
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
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleMetrics}>
        <View style={styles.metricRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.metricText}>{item.location}</Text>
        </View>

        {item.driver && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Driver:</Text>
            <Text style={styles.metricText}>{item.driver}</Text>
          </View>
        )}

        <View style={styles.metricRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.metricText}>
            Last Maintenance: {item.lastMaintenance.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Fuel size={16} color={getFuelLevelColor(item.fuelLevel)} />
          <Text style={styles.metricText}>
            Fuel: {item.fuelLevel}%
          </Text>
          <View style={styles.fuelBar}>
            <View
              style={[
                styles.fuelLevel,
                {
                  width: `${item.fuelLevel}%`,
                  backgroundColor: getFuelLevelColor(item.fuelLevel),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Mileage:</Text>
          <Text style={styles.metricText}>{item.mileage.toLocaleString()} km</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.manageButton}>
        <Settings size={16} color="#DC2626" />
        <Text style={styles.manageButtonText}>Manage Vehicle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('vehicles') || 'Vehicles'}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {vehicles.filter(v => v.status === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {vehicles.filter(v => v.status === 'maintenance').length}
          </Text>
          <Text style={styles.summaryLabel}>Maintenance</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {vehicles.filter(v => v.status === 'inactive').length}
          </Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
        </View>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Truck size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {t('no_vehicles') || 'No vehicles found'}
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
  vehicleCard: {
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
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 12,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleMetrics: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  fuelBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginLeft: 12,
    overflow: 'hidden',
  },
  fuelLevel: {
    height: '100%',
    borderRadius: 3,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
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