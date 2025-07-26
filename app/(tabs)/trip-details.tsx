import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  Bus,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Navigation,
  Calendar,
  Award,
  Shield,
  Truck,
} from 'lucide-react-native';

interface TripDetails {
  id: string;
  busNumber: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  departureDate: string;
  seatNumber: string;
  ticketNumber: string;
  fare: number;
  distance: string;
  estimatedDuration: string;
}

interface ManagerDetails {
  name: string;
  phone: string;
  email: string;
  depot: string;
  experience: string;
  rating: number;
  photo?: string;
}

interface DriverDetails {
  name: string;
  phone: string;
  licenseNumber: string;
  experience: string;
  rating: number;
  totalTrips: number;
  photo?: string;
}

interface ConductorDetails {
  name: string;
  phone: string;
  employeeId: string;
  experience: string;
  rating: number;
  photo?: string;
}

export default function TripDetailsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Mock trip details
  const tripDetails: TripDetails = {
    id: 'TRP-2024-001',
    busNumber: 'TN-01-AB-1234',
    route: 'Chennai → Madurai',
    departureTime: '08:00 AM',
    arrivalTime: '02:00 PM',
    status: 'completed',
    departureDate: '2024-01-25',
    seatNumber: 'A12',
    ticketNumber: 'TKT-2024-001',
    fare: 450,
    distance: '450 km',
    estimatedDuration: '6 hours',
  };

  // Mock manager details
  const managerDetails: ManagerDetails = {
    name: 'Rajesh Kumar',
    phone: '+91-98765-43210',
    email: 'rajesh.kumar@tnstc.in',
    depot: 'Chennai Central Depot',
    experience: '15 years',
    rating: 4.8,
    photo: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  // Mock driver details
  const driverDetails: DriverDetails = {
    name: 'Suresh Kumar',
    phone: '+91-98765-43211',
    licenseNumber: 'DL-01-2010-1234567',
    experience: '12 years',
    rating: 4.9,
    totalTrips: 1250,
    photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  // Mock conductor details
  const conductorDetails: ConductorDetails = {
    name: 'Lakshmi Devi',
    phone: '+91-98765-43212',
    employeeId: 'EMP-2020-001',
    experience: '8 years',
    rating: 4.7,
    photo: 'https://images.pexels.com/photos/2379006/pexels-photo-2379006.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#059669';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock size={16} color="#F59E0B" />;
      case 'in_progress': return <Navigation size={16} color="#3B82F6" />;
      case 'completed': return <CheckCircle size={16} color="#059669" />;
      case 'cancelled': return <AlertCircle size={16} color="#DC2626" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! Your response helps us improve our services.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowFeedbackModal(false);
            setRating(0);
            setFeedback('');
          },
        },
      ]
    );
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            color={star <= rating ? '#F59E0B' : '#E5E7EB'}
            fill={star <= rating ? '#F59E0B' : 'none'}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Navbar title="Trip Details" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(tripDetails.status) + '20' }]}>
          <View style={styles.statusContent}>
            {getStatusIcon(tripDetails.status)}
            <Text style={[styles.statusText, { color: getStatusColor(tripDetails.status) }]}>
              {tripDetails.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {tripDetails.status === 'completed' && (
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => setShowFeedbackModal(true)}
            >
              <MessageSquare size={16} color="#DC2626" />
              <Text style={styles.feedbackButtonText}>Rate Trip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Bus size={24} color="#DC2626" />
              <Text style={styles.busNumber}>{tripDetails.busNumber}</Text>
            </View>
            
            <View style={styles.tripDetails}>
              <View style={styles.tripDetail}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.tripDetailText}>{tripDetails.route}</Text>
              </View>
              <View style={styles.tripDetail}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.tripDetailText}>{tripDetails.departureDate}</Text>
              </View>
              <View style={styles.tripDetail}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.tripDetailText}>
                  {tripDetails.departureTime} - {tripDetails.arrivalTime}
                </Text>
              </View>
              <View style={styles.tripDetail}>
                <Navigation size={16} color="#6B7280" />
                <Text style={styles.tripDetailText}>{tripDetails.distance}</Text>
              </View>
            </View>

            <View style={styles.ticketInfo}>
              <View style={styles.ticketDetail}>
                <Text style={styles.ticketLabel}>Ticket Number</Text>
                <Text style={styles.ticketValue}>{tripDetails.ticketNumber}</Text>
              </View>
              <View style={styles.ticketDetail}>
                <Text style={styles.ticketLabel}>Seat Number</Text>
                <Text style={styles.ticketValue}>{tripDetails.seatNumber}</Text>
              </View>
              <View style={styles.ticketDetail}>
                <Text style={styles.ticketLabel}>Fare</Text>
                <Text style={styles.ticketValue}>₹{tripDetails.fare}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Manager Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manager Details</Text>
          <View style={styles.personCard}>
            <View style={styles.personHeader}>
              <Image
                source={{ uri: managerDetails.photo }}
                style={styles.personPhoto}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{managerDetails.name}</Text>
                <Text style={styles.personRole}>Depot Manager</Text>
                {renderStars(managerDetails.rating)}
              </View>
            </View>
            
            <View style={styles.personDetails}>
              <View style={styles.personDetail}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{managerDetails.phone}</Text>
              </View>
              <View style={styles.personDetail}>
                <Mail size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{managerDetails.email}</Text>
              </View>
              <View style={styles.personDetail}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{managerDetails.depot}</Text>
              </View>
              <View style={styles.personDetail}>
                <Award size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{managerDetails.experience} experience</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Driver Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          <View style={styles.personCard}>
            <View style={styles.personHeader}>
              <Image
                source={{ uri: driverDetails.photo }}
                style={styles.personPhoto}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{driverDetails.name}</Text>
                <Text style={styles.personRole}>Bus Driver</Text>
                {renderStars(driverDetails.rating)}
              </View>
            </View>
            
            <View style={styles.personDetails}>
              <View style={styles.personDetail}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{driverDetails.phone}</Text>
              </View>
              <View style={styles.personDetail}>
                <Shield size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>License: {driverDetails.licenseNumber}</Text>
              </View>
              <View style={styles.personDetail}>
                <Award size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{driverDetails.experience} experience</Text>
              </View>
              <View style={styles.personDetail}>
                <Truck size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{driverDetails.totalTrips} trips completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Conductor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conductor Details</Text>
          <View style={styles.personCard}>
            <View style={styles.personHeader}>
              <Image
                source={{ uri: conductorDetails.photo }}
                style={styles.personPhoto}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{conductorDetails.name}</Text>
                <Text style={styles.personRole}>Bus Conductor</Text>
                {renderStars(conductorDetails.rating)}
              </View>
            </View>
            
            <View style={styles.personDetails}>
              <View style={styles.personDetail}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{conductorDetails.phone}</Text>
              </View>
              <View style={styles.personDetail}>
                <User size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>ID: {conductorDetails.employeeId}</Text>
              </View>
              <View style={styles.personDetail}>
                <Award size={16} color="#6B7280" />
                <Text style={styles.personDetailText}>{conductorDetails.experience} experience</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Trip</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <AlertCircle size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                How was your journey from {tripDetails.route}?
              </Text>

              {/* Rating Stars */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Rate your experience:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRatingPress(star)}
                      style={styles.starButton}
                    >
                      <Star
                        size={32}
                        color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                        fill={star <= rating ? '#F59E0B' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {rating === 0 ? 'Select rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </Text>
              </View>

              {/* Feedback Text */}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Additional Comments (Optional):</Text>
                <TextInput
                  style={styles.feedbackInput}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Share your experience, suggestions, or any issues..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitFeedback}
              >
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
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
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  feedbackButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  tripDetails: {
    marginBottom: 16,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  ticketInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  ticketDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  personRole: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  personDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  personDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  starButton: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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