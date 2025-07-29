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
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getVehiclesByManager,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  Vehicle,
} from '@/services/api';
import {
  Truck,
  MapPin,
  Clock,
  Fuel,
  Settings,
  Plus,
  Edit,
  Trash2,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Navbar from '@/components/Navbar';

export default function ManagerVehiclesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: '',
    make: '',
    model: '',
    year: '',
    location: '',
    accidents: '0',
    km_driven: '0',
    remaining_fuel: '',
    tire_pressure: '',
    service_date: '',
    inspection_date: '',
    service_type: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [user?.username]);

  const loadVehicles = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      console.log('Fetching vehicles for manager:', user.username);
      const data = await getVehiclesByManager(user.username);
      console.log('Vehicles data received:', data);
      setVehicles(data);
      setFilteredVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const handleAddVehicle = async () => {
    try {
      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        accidents: parseInt(formData.accidents),
        km_driven: parseInt(formData.km_driven),
        remaining_fuel: formData.remaining_fuel
          ? parseFloat(formData.remaining_fuel)
          : null,
        tire_pressure: formData.tire_pressure
          ? parseFloat(formData.tire_pressure)
          : null,
        manager_username: user?.username,
      };

      await createVehicle(vehicleData);
      setShowAddModal(false);
      resetForm();
      loadVehicles();
      Alert.alert('Success', 'Vehicle added successfully!');
    } catch (err) {
      console.error('Failed to add vehicle:', err);
      Alert.alert('Error', 'Failed to add vehicle. Please try again.');
    }
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        accidents: parseInt(formData.accidents),
        km_driven: parseInt(formData.km_driven),
        remaining_fuel: formData.remaining_fuel
          ? parseFloat(formData.remaining_fuel)
          : null,
        tire_pressure: formData.tire_pressure
          ? parseFloat(formData.tire_pressure)
          : null,
      };

      await updateVehicle(selectedVehicle.vehicle_id, vehicleData);
      setShowEditModal(false);
      setSelectedVehicle(null);
      resetForm();
      loadVehicles();
      Alert.alert('Success', 'Vehicle updated successfully!');
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      Alert.alert('Error', 'Failed to update vehicle. Please try again.');
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.license_plate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.vehicle_id);
              loadVehicles();
              Alert.alert('Success', 'Vehicle deleted successfully!');
            } catch (err) {
              console.error('Failed to delete vehicle:', err);
              Alert.alert(
                'Error',
                'Failed to delete vehicle. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      license_plate: '',
      vehicle_type: '',
      make: '',
      model: '',
      year: '',
      location: '',
      accidents: '0',
      km_driven: '0',
      remaining_fuel: '',
      tire_pressure: '',
      service_date: '',
      inspection_date: '',
      service_type: '',
    });
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      location: vehicle.location || '',
      accidents: vehicle.accidents?.toString() || '0',
      km_driven: vehicle.km_driven?.toString() || '0',
      remaining_fuel: vehicle.remaining_fuel?.toString() || '',
      tire_pressure: vehicle.tire_pressure?.toString() || '',
      service_date: vehicle.service_date || '',
      inspection_date: vehicle.inspection_date || '',
      service_type: vehicle.service_type || '',
    });
    setShowEditModal(true);
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
    <View
      style={[
        styles.vehicleCard,
        { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status) },
      ]}
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

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
          <Text style={[styles.actionButtonText, styles.editButtonText]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVehicle(item)}
        >
          <Trash2 size={16} color="#DC2626" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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

  if (filteredVehicles.length === 0) {
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
      <Navbar title="Vehicles Management" />
      <FlatList
        data={filteredVehicles}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="License Plate"
                value={formData.license_plate}
                onChangeText={(text) =>
                  setFormData({ ...formData, license_plate: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Vehicle Type"
                value={formData.vehicle_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, vehicle_type: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Make"
                value={formData.make}
                onChangeText={(text) =>
                  setFormData({ ...formData, make: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Model"
                value={formData.model}
                onChangeText={(text) =>
                  setFormData({ ...formData, model: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Year"
                value={formData.year}
                onChangeText={(text) =>
                  setFormData({ ...formData, year: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Accidents (0)"
                value={formData.accidents}
                onChangeText={(text) =>
                  setFormData({ ...formData, accidents: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="KM Driven (0)"
                value={formData.km_driven}
                onChangeText={(text) =>
                  setFormData({ ...formData, km_driven: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Remaining Fuel (%)"
                value={formData.remaining_fuel}
                onChangeText={(text) =>
                  setFormData({ ...formData, remaining_fuel: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Tire Pressure (PSI)"
                value={formData.tire_pressure}
                onChangeText={(text) =>
                  setFormData({ ...formData, tire_pressure: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Service Date (YYYY-MM-DD)"
                value={formData.service_date}
                onChangeText={(text) =>
                  setFormData({ ...formData, service_date: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Inspection Date (YYYY-MM-DD)"
                value={formData.inspection_date}
                onChangeText={(text) =>
                  setFormData({ ...formData, inspection_date: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Service Type"
                value={formData.service_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, service_type: text })
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddVehicle}
              >
                <Text style={styles.saveButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Vehicle</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="License Plate"
                value={formData.license_plate}
                onChangeText={(text) =>
                  setFormData({ ...formData, license_plate: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Vehicle Type"
                value={formData.vehicle_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, vehicle_type: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Make"
                value={formData.make}
                onChangeText={(text) =>
                  setFormData({ ...formData, make: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Model"
                value={formData.model}
                onChangeText={(text) =>
                  setFormData({ ...formData, model: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Year"
                value={formData.year}
                onChangeText={(text) =>
                  setFormData({ ...formData, year: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Accidents"
                value={formData.accidents}
                onChangeText={(text) =>
                  setFormData({ ...formData, accidents: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="KM Driven"
                value={formData.km_driven}
                onChangeText={(text) =>
                  setFormData({ ...formData, km_driven: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Remaining Fuel (%)"
                value={formData.remaining_fuel}
                onChangeText={(text) =>
                  setFormData({ ...formData, remaining_fuel: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Tire Pressure (PSI)"
                value={formData.tire_pressure}
                onChangeText={(text) =>
                  setFormData({ ...formData, tire_pressure: text })
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Service Date (YYYY-MM-DD)"
                value={formData.service_date}
                onChangeText={(text) =>
                  setFormData({ ...formData, service_date: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Inspection Date (YYYY-MM-DD)"
                value={formData.inspection_date}
                onChangeText={(text) =>
                  setFormData({ ...formData, inspection_date: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Service Type"
                value={formData.service_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, service_type: text })
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditVehicle}
              >
                <Text style={styles.saveButtonText}>Update Vehicle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 0,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
    paddingTop: 16,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  editButtonText: {
    color: '#3B82F6',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
