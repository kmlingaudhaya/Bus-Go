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
      default: return <Clock size={16} color="#6B7280" />;
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
      id: Date.now().toString(),
      type: selectedType as any,
      title,
      description,
      busNumber: busNumber || undefined,
      route: route || undefined,
      status: 'pending',
      createdAt: new Date(),
      priority: selectedPriority as any,
      ticketNumber: `GRV-${new Date().getFullYear()}-${String(grievances.length + 1).padStart(3, '0')}`,
    };

    setGrievances([newGrievance, ...grievances]);
    setShowNewGrievanceModal(false);
    resetForm();
    Alert.alert('Success', 'Your grievance has been submitted successfully');
  };

  const resetForm = () => {
    setSelectedType('');
    setSelectedPriority('');
    setTitle('');
    setDescription('');
    setBusNumber('');
    setRoute('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Navbar title="Grievances" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report Issues</Text>
          <Text style={styles.headerSubtitle}>
            Help us improve our services by reporting any issues you encounter
          </Text>
        </View>

        {/* New Grievance Button */}
        <TouchableOpacity
          style={styles.newGrievanceButton}
          onPress={() => setShowNewGrievanceModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.newGrievanceButtonText}>Report New Issue</Text>
        </TouchableOpacity>

        {/* Grievances List */}
        <View style={styles.grievancesSection}>
          <Text style={styles.sectionTitle}>Your Complaints</Text>
          {grievances.map((grievance) => (
            <View key={grievance.id} style={styles.grievanceCard}>
              <View style={styles.grievanceHeader}>
                <View style={styles.grievanceType}>
                  {grievanceTypes.find(t => t.key === grievance.type)?.icon}
                  <Text style={styles.grievanceTypeText}>
                    {getTypeLabel(grievance.type)}
                  </Text>
                </View>
                <View style={styles.grievanceStatus}>
                  {getStatusIcon(grievance.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(grievance.status) }]}>
                    {grievance.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.grievanceTitle}>{grievance.title}</Text>
              <Text style={styles.grievanceDescription}>{grievance.description}</Text>

              {grievance.busNumber && (
                <View style={styles.grievanceDetail}>
                  <Bus size={14} color="#6B7280" />
                  <Text style={styles.grievanceDetailText}>Bus: {grievance.busNumber}</Text>
                </View>
              )}

              {grievance.route && (
                <View style={styles.grievanceDetail}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.grievanceDetailText}>Route: {grievance.route}</Text>
                </View>
              )}

              <View style={styles.grievanceFooter}>
                <View style={styles.grievanceMeta}>
                  <Text style={styles.ticketNumber}>#{grievance.ticketNumber}</Text>
                  <Text style={styles.grievanceDate}>
                    {formatDate(grievance.createdAt)}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(grievance.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(grievance.priority) }]}>
                    {getPriorityLabel(grievance.priority)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Support Information */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Need Immediate Help?</Text>
          <View style={styles.supportCard}>
            <View style={styles.supportItem}>
              <Phone size={20} color="#DC2626" />
              <Text style={styles.supportText}>Emergency: 1800-425-1234</Text>
            </View>
            <View style={styles.supportItem}>
              <Mail size={20} color="#DC2626" />
              <Text style={styles.supportText}>Email: grievances@tnstc.in</Text>
            </View>
          </View>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report New Issue</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewGrievanceModal(false);
                  resetForm();
                }}
              >
                <XCircle size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Issue Type */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Issue Type *</Text>
                <View style={styles.typeGrid}>
                  {grievanceTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        selectedType === type.key && styles.selectedTypeOption,
                      ]}
                      onPress={() => setSelectedType(type.key)}
                    >
                      {type.icon}
                      <Text style={[
                        styles.typeOptionText,
                        selectedType === type.key && styles.selectedTypeOptionText,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Priority *</Text>
                <View style={styles.priorityGrid}>
                  {priorityLevels.map((priority) => (
                    <TouchableOpacity
                      key={priority.key}
                      style={[
                        styles.priorityOption,
                        { borderColor: priority.color },
                        selectedPriority === priority.key && { backgroundColor: priority.color + '20' },
                      ]}
                      onPress={() => setSelectedPriority(priority.key)}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        { color: priority.color },
                        selectedPriority === priority.key && { fontWeight: 'bold' },
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Brief description of the issue"
                  multiline
                />
              </View>

              {/* Description */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Please provide detailed information about the issue..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Bus Number */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Bus Number (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={busNumber}
                  onChangeText={setBusNumber}
                  placeholder="e.g., TN-01-AB-1234"
                />
              </View>

              {/* Route */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Route (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={route}
                  onChangeText={setRoute}
                  placeholder="e.g., Chennai - Madurai"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewGrievanceModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitGrievance}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
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
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  newGrievanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  newGrievanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  grievancesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  grievanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grievanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  grievanceType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grievanceTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  grievanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  grievanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  grievanceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  grievanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  grievanceDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  grievanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  grievanceMeta: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  grievanceDate: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  supportSection: {
    marginBottom: 24,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedTypeOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedTypeOptionText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  priorityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    marginLeft: 8,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 