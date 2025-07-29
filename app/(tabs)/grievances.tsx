import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bus,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react-native';

interface Grievance {
  id: string;
  type: 'bus_issue' | 'driver_issue' | 'conductor_issue' | 'booking_issue' | 'other';
  title: string;
  description: string;
  busNumber?: string;
  route?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  ticketNumber: string;
}

const grievanceTypes = [
  { key: 'bus_issue', label: 'Bus Issue', icon: <Bus size={20} color="#DC2626" /> },
  { key: 'driver_issue', label: 'Driver Issue', icon: <User size={20} color="#DC2626" /> },
  { key: 'conductor_issue', label: 'Conductor Issue', icon: <User size={20} color="#DC2626" /> },
  { key: 'booking_issue', label: 'Booking Issue', icon: <MessageSquare size={20} color="#DC2626" /> },
  { key: 'other', label: 'Other', icon: <AlertTriangle size={20} color="#DC2626" /> },
];

const priorityLevels = [
  { key: 'low', label: 'Low', color: '#059669' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'high', label: 'High', color: '#DC2626' },
];

export default function GrievancesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [grievances, setGrievances] = useState<Grievance[]>([
    {
      id: '1',
      type: 'bus_issue',
      title: 'Bus AC not working',
      description: 'The air conditioning system was not functioning properly during the journey from Chennai to Madurai.',
      busNumber: 'TN-01-AB-1234',
      route: 'Chennai - Madurai',
      status: 'resolved',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-17'),
      priority: 'medium',
      ticketNumber: 'GRV-2024-001',
    },
    {
      id: '2',
      type: 'driver_issue',
      title: 'Rash driving complaint',
      description: 'The driver was driving recklessly and not following traffic rules.',
      busNumber: 'TN-02-CD-5678',
      route: 'Chennai - Coimbatore',
      status: 'in_progress',
      createdAt: new Date('2024-01-20'),
      priority: 'high',
      ticketNumber: 'GRV-2024-002',
    },
    {
      id: '3',
      type: 'booking_issue',
      title: 'Ticket booking failed',
      description: 'Unable to book ticket online, payment was deducted but ticket not generated.',
      status: 'pending',
      createdAt: new Date('2024-01-22'),
      priority: 'high',
      ticketNumber: 'GRV-2024-003',
    },
  ]);

  const [showNewGrievanceModal, setShowNewGrievanceModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [route, setRoute] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#059669';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'in_progress': return <Clock size={16} color="#3B82F6" />;
      case 'resolved': return <CheckCircle size={16} color="#059669" />;
      case 'rejected': return <XCircle size={16} color="#DC2626" />;
      default: return <AlertTriangle size={16} color="#6B7280" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const found = grievanceTypes.find(t => t.key === type);
    return found ? found.label : 'Other';
  };

  const getPriorityLabel = (priority: string) => {
    const found = priorityLevels.find(p => p.key === priority);
    return found ? found.label : 'Low';
  };

  const getPriorityColor = (priority: string) => {
    const found = priorityLevels.find(p => p.key === priority);
    return found ? found.color : '#059669';
  };

  const handleSubmitGrievance = () => {
    if (!selectedType || !title || !description || !selectedPriority) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const newGrievance: Grievance = {
      id: (grievances.length + 1).toString(),
      type: selectedType as any,
      title,
      description,
      busNumber,
      route,
      status: 'pending',
      createdAt: new Date(),
      priority: selectedPriority as any,
      ticketNumber: `GRV-2024-00${grievances.length + 1}`,
    };
    setGrievances([newGrievance, ...grievances]);
    setShowNewGrievanceModal(false);
    setSelectedType('');
    setSelectedPriority('');
    setTitle('');
    setDescription('');
    setBusNumber('');
    setRoute('');
    Alert.alert('Submitted', 'Your grievance has been submitted.');
  };

  return (
    <View style={styles.container}>
      <Navbar title="Grievances" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Grievances</Text>
          <Text style={styles.subtitle}>Report and track your issues</Text>
        </View>

        {/* Filter Bar */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.filtersTitle}>Type</Text>
          </View>
          <View style={styles.filtersGrid}>
            {grievanceTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.filterButton,
                  selectedType === type.key && styles.selectedFilterButton,
                ]}
                onPress={() => setSelectedType(type.key)}
              >
                {type.icon}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedType === type.key && styles.selectedFilterButtonText,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowNewGrievanceModal(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grievance List */}
        <View style={styles.listContainer}>
          {grievances.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertTriangle size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No grievances found</Text>
              <Text style={styles.emptySubtext}>You have not reported any issues yet.</Text>
            </View>
          ) : (
            grievances
              .filter(g => !selectedType || g.type === selectedType)
              .map((g) => (
                <View key={g.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTypeIcon}>
                      {grievanceTypes.find(t => t.key === g.type)?.icon}
                    </View>
                    <Text style={styles.cardTitle}>{g.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(g.status) + '20' }]}>
                      {getStatusIcon(g.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(g.status) }]}>
                        {g.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardDescription}>{g.description}</Text>
                  <View style={styles.cardDetailsRow}>
                    {g.busNumber && (
                      <View style={styles.detailItem}>
                        <Bus size={14} color="#DC2626" />
                        <Text style={styles.detailText}>{g.busNumber}</Text>
                      </View>
                    )}
                    {g.route && (
                      <View style={styles.detailItem}>
                        <MapPin size={14} color="#059669" />
                        <Text style={styles.detailText}>{g.route}</Text>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor(g.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(g.priority) }]}>
                          {getPriorityLabel(g.priority)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.ticketNumber}>Ticket: {g.ticketNumber}</Text>
                    <Text style={styles.dateText}>
                      {g.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>

      {/* New Grievance Modal */}
      <Modal
        visible={showNewGrievanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewGrievanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Grievance</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Bus Number (optional)"
              value={busNumber}
              onChangeText={setBusNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Route (optional)"
              value={route}
              onChangeText={setRoute}
            />
            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.modalTypeGrid}>
              {grievanceTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.modalTypeButton,
                    selectedType === type.key && styles.selectedModalTypeButton,
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  {type.icon}
                  <Text
                    style={[
                      styles.modalTypeButtonText,
                      selectedType === type.key && styles.selectedModalTypeButtonText,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.modalPriorityGrid}>
              {priorityLevels.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.modalPriorityButton,
                    selectedPriority === p.key && styles.selectedModalPriorityButton,
                  ]}
                  onPress={() => setSelectedPriority(p.key)}
                >
                  <Text
                    style={[
                      styles.modalPriorityButtonText,
                      selectedPriority === p.key && { color: p.color },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitGrievance}
              >
                <CheckCircle size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewGrievanceModal(false)}
              >
                <XCircle size={16} color="#DC2626" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
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
    alignItems: 'center',
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
    marginLeft: 6,
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTypeIcon: {
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ticketNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  modalTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modalTypeButton: {
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
  selectedModalTypeButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  modalTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  selectedModalTypeButtonText: {
    color: '#FFFFFF',
  },
  modalPriorityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalPriorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  selectedModalPriorityButton: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  modalPriorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
});