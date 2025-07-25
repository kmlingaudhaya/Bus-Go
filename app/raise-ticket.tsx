import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import * as Location from 'expo-location';

const API_URL = 'https://safeway-backend-75xq.onrender.com/api/complaints';

export default function RaiseTicketScreen() {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [place, setPlace] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [grievanceType, setGrievanceType] = useState('Rash Driving');
  const [otherType, setOtherType] = useState('');
  const grievanceOptions = [
    'Rash Driving',
    'Not Stopping',
    'Skipping Signals',
    'High Speed',
    'cleaniness',
    'driver behaviour',
    'Others'
  ];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Only allow passengers and conductors
  useEffect(() => {
    if (!user || user.role === 'staff') {
      Alert.alert('Not allowed', 'Only users and conductors can raise a ticket.');
      router.replace('/');
    }
  }, [user]);

  // Optionally auto-fill place using location
  const autofillPlace = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to autofill place.');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (places.length > 0) {
        const p = places[0];
        const placeName = [p.name, p.street, p.district, p.city, p.region, p.postalCode, p.country].filter(Boolean).join(', ');
        setPlace(placeName);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get location.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!complaint.trim() || !place.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (!user?.username) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }
    setLoading(true);
    try {
      const type = grievanceType === 'Others' ? otherType : grievanceType;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_text: complaint,
          place,
          bus_number: busNumber,
          type,
          username: user.username,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit ticket');
      }
      Alert.alert('Ticket Submitted', 'Your complaint has been submitted successfully.');
      setComplaint('');
      setPlace('');
      setBusNumber('');
      setExtraInfo('');
      setGrievanceType('Rash Driving');
      setOtherType('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit ticket');
    }
    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      extraScrollHeight={40}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Raise a Ticket</Text>
      <Text style={styles.label}>Complaint / Grievance *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your issue..."
        value={complaint}
        onChangeText={setComplaint}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.label}>Place *</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter place or use location"
          value={place}
          onChangeText={setPlace}
        />
        <TouchableOpacity style={styles.locationButton} onPress={autofillPlace} disabled={loading}>
          <Text style={styles.locationButtonText}>{loading ? '...' : 'Use My Location'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Bus Number (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter bus number (if known)"
        value={busNumber}
        onChangeText={setBusNumber}
      />
      <Text style={styles.label}>Type of Grievance *</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setDropdownOpen(!dropdownOpen)}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownText}>
          {grievanceType}
        </Text>
      </TouchableOpacity>
      {dropdownOpen && (
        <View style={styles.dropdownList}>
          {grievanceOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                setGrievanceType(option);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {grievanceType === 'Others' && (
        <TextInput
          style={styles.input}
          placeholder="Please specify"
          value={otherType}
          onChangeText={setOtherType}
        />
      )}
      <Text style={styles.label}>Extra Info (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any other details..."
        value={extraInfo}
        onChangeText={setExtraInfo}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Ticket</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  locationButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 8,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 15,
    color: '#374151',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    top: 220, // Adjust this value based on your layout
    left: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
}); 