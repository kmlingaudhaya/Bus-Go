import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ArrowLeftRight, Calendar, MapPin } from 'lucide-react-native';
import { tamilNaduCities } from '@/data/mockData';

interface SearchBarProps {
  from: string;
  to: string;
  date: Date;
  onFromChange: (city: string) => void;
  onToChange: (city: string) => void;
  onDateChange: (date: Date) => void;
  onSwap: () => void;
}

export default function SearchBar({
  from,
  to,
  date,
  onFromChange,
  onToChange,
  onDateChange,
  onSwap,
}: SearchBarProps) {
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === dayAfter.toDateString()) return 'Day After';
    return date.toLocaleDateString('en-IN');
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const CityModal = ({ 
    visible, 
    onClose, 
    onSelect, 
    selectedCity 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    onSelect: (city: string) => void;
    selectedCity: string;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select City</Text>
          <FlatList
            data={tamilNaduCities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cityItem,
                  item === selectedCity && styles.selectedCity
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.cityText,
                  item === selectedCity && styles.selectedCityText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const DateModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Date</Text>
          <FlatList
            data={getDateOptions()}
            keyExtractor={(item) => item.toISOString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dateItem,
                  item.toDateString() === date.toDateString() && styles.selectedDate
                ]}
                onPress={() => {
                  onDateChange(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.dateText,
                  item.toDateString() === date.toDateString() && styles.selectedDateText
                ]}>
                  {formatDate(item)} - {item.toLocaleDateString('en-IN')}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.routeContainer}>
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setShowFromModal(true)}
        >
          <MapPin size={16} color="#DC2626" />
          <View style={styles.cityInfo}>
            <Text style={styles.cityLabel}>From</Text>
            <Text style={styles.cityName}>{from}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
          <ArrowLeftRight size={20} color="#DC2626" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setShowToModal(true)}
        >
          <MapPin size={16} color="#DC2626" />
          <View style={styles.cityInfo}>
            <Text style={styles.cityLabel}>To</Text>
            <Text style={styles.cityName}>{to}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDateModal(true)}
      >
        <Calendar size={16} color="#DC2626" />
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </TouchableOpacity>

      <CityModal
        visible={showFromModal}
        onClose={() => setShowFromModal(false)}
        onSelect={onFromChange}
        selectedCity={from}
      />

      <CityModal
        visible={showToModal}
        onClose={() => setShowToModal(false)}
        onSelect={onToChange}
        selectedCity={to}
      />

      <DateModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cityInfo: {
    marginLeft: 8,
  },
  cityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  swapButton: {
    marginHorizontal: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  cityItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedCity: {
    backgroundColor: '#FEF2F2',
  },
  cityText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedCityText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  dateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDate: {
    backgroundColor: '#FEF2F2',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedDateText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});