import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVehiclesByManager } from '@/services/api';
import {
  Truck,
  MapPin,
  Clock,
  Fuel,
  Settings,
  Plus,
} from 'lucide-react-native';

interface Vehicle {
  vehicle_id: string;
  license_plate: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  status: string;
  location?: string;
  image_url?: string;
  accidents?: number;
  km_driven?: number;
  remaining_fuel?: number;
  service_date?: string;
  inspection_date?: string;
  service_type?: string;
  manager_username: string;
  created_at: string;
  updated_at: string;
}

export default function ManagerVehiclesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, [user?.username]);

  const loadVehicles = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      const data = await getVehiclesByManager(user.username);
      setVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    await loadVehicles();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return '#10B981'; // green
      case 'in_use':
        return '#3B82F6'; // blue
      case 'maintenance':
        return '#F59E0B'; // amber
      case 'inactive':
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return '#D1FAE5';
      case 'in_use':
        return '#DBEAFE';
      case 'maintenance':
        return '#FEF3C7';
      case 'inactive':
      default:
        return '#F3F4F6';
    }
  };

  const getStatusText = (status: string) => {
    return status
      ?.split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status) },
      ]}
      onPress={() => {
        // Navigate to vehicle details screen
        // navigation.navigate('VehicleDetails', { vehicleId: item.vehicle_id });
      }}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleTitle}>
          <Truck size={20} color="#4B5563" />
          <Text style={styles.vehicleNumber}>{item.license_plate}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusBgColor(item.status),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicleType}>
          {item.make} {item.model} ({item.year})
        </Text>
      </View>

      <View style={styles.vehicleInfo}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder]}>
            <Truck size={32} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.vehicleDetails}>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.location || 'Location not specified'}
            </Text>
          </View>

          {item.km_driven !== undefined && (
            <View style={styles.detailRow}>
              <Settings size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.km_driven.toLocaleString()} km driven
              </Text>
            </View>
          )}

          {item.remaining_fuel !== undefined && (
            <View style={styles.detailRow}>
              <Fuel size={16} color="#3B82F6" />
              <Text style={styles.detailText}>
                Fuel: {item.remaining_fuel}% remaining
              </Text>
            </View>
          )}

          {item.service_date && (
            <View style={styles.detailRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Last service: {new Date(item.service_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {item.inspection_date && (
            <View style={styles.detailRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Last inspection:{' '}
                {new Date(item.inspection_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.manageButton}>
        <Settings size={16} color="#DC2626" />
        <Text style={styles.manageButtonText}>Manage Vehicle</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVehicles}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Please log in to view vehicles</Text>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Truck size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No vehicles found</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.vehicle_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleHeader: {
    marginBottom: 12,
  },
  vehicleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleType: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 28,
  },
  vehicleInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vehicleImage: {
    width: 100,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  vehicleImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  manageButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
