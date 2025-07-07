import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Dimensions, Modal, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { mockTrips, mockNotifications } from '@/data/mockData';
import { Trip, RouteStop, StopStatus } from '@/types';
import { MapPin, Clock, Navigation, Users, Phone, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import type { LocationObjectCoords } from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteTracker from '@/components/RouteTracker';

const { height: screenHeight } = Dimensions.get('window');

// ===== DEBUG VARIABLES =====
const GPS_INTERVAL_SECONDS = 10; // How often to collect GPS data (seconds)
const STOP_MIN_DURATION_SECONDS = 30; // How many seconds to consider a stop
// ==========================

const dummyActiveTrip: Trip = {
  id: '101',
  busId: 'bus-001',
  conductorId: 'conductor-001',
  route: {
    id: 'route-001',
    from: 'Chennai',
    to: 'Salem',
    distance: '350 km',
    stops: ['Chennai', 'Kancheepuram', 'Vellore', 'Ambur', 'Krishnagiri', 'Dharmapuri', 'Salem'],
    routeType: 'long_distance'
  },
  status: 'started',
  vehicleNumber: 'TN05JK7890',
  depotCode: 'CHN001',
  scheduledDeparture: new Date('2024-06-01T09:00:00'),
  actualDeparture: new Date('2024-06-01T09:00:00'),
  scheduledArrival: new Date('2024-06-01T15:00:00'),
  passengersBoarded: 45,
  revenue: 12500
};

// Type for detected stops
interface Stop {
  place: string;
  minutes: number;
}

// Dummy route data
const dummyRouteStops: RouteStop[] = [
  { name: 'Chennai', status: 'completed' as StopStatus, reachedAt: Date.now() - 3600000, completedAt: Date.now() - 3500000, duration: 2 },
  { name: 'Kancheepuram', status: 'completed' as StopStatus, reachedAt: Date.now() - 3000000, completedAt: Date.now() - 2900000, duration: 2 },
  { name: 'Vellore', status: 'reached' as StopStatus, reachedAt: Date.now() - 600000 },
  { name: 'Ambur', status: 'pending' as StopStatus },
  { name: 'Krishnagiri', status: 'pending' as StopStatus },
  { name: 'Dharmapuri', status: 'pending' as StopStatus },
  { name: 'Salem', status: 'pending' as StopStatus },
];

export default function ConductorTrackingScreen() {
  const { user } = useAuth();
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const unreadNotifications = mockNotifications.filter(n => !n.read && n.userId === user?.user_id?.toString()).length;
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [locationHistory, setLocationHistory] = useState<{ latitude: number; longitude: number; timestamp: number }[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [routeStops, setRouteStops] = useState<RouteStop[]>(dummyRouteStops);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const intervalRef = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  const [lastGpsDebug, setLastGpsDebug] = useState<{ timestamp: number; latitude: number; longitude: number } | null>(null);
  
  // New state for trip management
  const [tripStarted, setTripStarted] = useState(false);
  const [tripStops, setTripStops] = useState<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'reached' | 'completed' | 'overdue';
    reachedAt?: number;
    completedAt?: number;
    requiredWaitTime: number; // minutes
    actualWaitTime?: number; // minutes
  }[]>([]);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStop, setNewStop] = useState({
    name: '',
    latitude: '',
    longitude: ''
  });
  const [showMapSelection, setShowMapSelection] = useState(false);
  const [lastTap, setLastTap] = useState<{ time: number; coordinate: { latitude: number; longitude: number } } | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    // Set dummy active trip for testing
    setActiveTrips([dummyActiveTrip]);
    setSelectedTrip(dummyActiveTrip);
  }, [user]);

  // Get current location once
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // Start tracking
  const startTracking = async () => {
    setTracking(true);
    setLocationHistory([]);
    setStops([]);
      intervalRef.current = setInterval(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({});
      
      // Update current location state with latest GPS data
      setLocation(loc.coords);
      
      setLocationHistory(prev => [
        ...prev,
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }
      ]);
      setLastGpsDebug({ timestamp: Date.now(), latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      
      // Update current location
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (places.length > 0) {
            const p = places[0];
          const placeName = [p.name, p.street, p.city, p.region].filter(Boolean).join(', ');
          setCurrentLocation(placeName);
        }
      } catch (e) {
        setCurrentLocation(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    }, GPS_INTERVAL_SECONDS * 1000);
  };

  // Stop tracking and analyze
  const stopTracking = async () => {
    setTracking(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAnalyzing(true);
    const detectedStops: Stop[] = [];
    let i = 0;
    while (i < locationHistory.length) {
      let j = i + 1;
      while (
        j < locationHistory.length &&
        getDistance(locationHistory[i], locationHistory[j]) < 30 // meters
      ) {
        j++;
      }
      const duration = (locationHistory[j - 1].timestamp - locationHistory[i].timestamp) / 1000; // seconds
      if (duration >= STOP_MIN_DURATION_SECONDS) {
        // Reverse geocode
        const place = await getPlace(locationHistory[i].latitude, locationHistory[i].longitude);
        detectedStops.push({ place, minutes: Math.round(duration / 60) });
      }
      i = j;
    }
    setStops(detectedStops);
    setAnalyzing(false);
  };

  // Helper: Haversine formula for distance in meters
  function getDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const aVal =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  // Helper: Reverse geocode
  async function getPlace(lat: number, lon: number) {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (places.length > 0) {
        const p = places[0];
        return [p.name, p.street, p.city, p.region, p.country].filter(Boolean).join(', ');
      }
    } catch {}
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }

  // Helper: Get status color
  function getStatusColor(status?: StopStatus) {
    switch (status) {
      case 'pending': return '#D1D5DB';
      case 'reached': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'overdue': return '#EF4444';
      default: return '#D1D5DB';
    }
  }

  // Add a new stop to the trip
  const addStop = () => {
    const lat = parseFloat(newStop.latitude);
    const lng = parseFloat(newStop.longitude);
    if (newStop.name && !isNaN(lat) && !isNaN(lng)) {
      const stop = {
        id: Date.now().toString(),
        name: newStop.name,
        latitude: lat,
        longitude: lng,
        status: 'pending' as const,
        requiredWaitTime: 5 // 5 minutes default
      };
      setTripStops(prev => [...prev, stop]);
      setNewStop({ name: '', latitude: '', longitude: '' });
      setShowAddStopModal(false);
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid name, latitude, and longitude.');
    }
  };

  // Get current GPS location
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use current location.');
        return;
      }
      
      let loc = await Location.getCurrentPositionAsync({});
      setNewStop(prev => ({
        ...prev,
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString()
      }));
      
      // Try to get place name
      try {
        const places = await Location.reverseGeocodeAsync({ 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        });
        if (places.length > 0) {
          const p = places[0];
          const placeName = [p.name, p.street, p.city, p.region].filter(Boolean).join(', ');
          if (placeName) {
            setNewStop(prev => ({ ...prev, name: placeName }));
          }
        }
      } catch (e) {
        // If reverse geocoding fails, just use coordinates as name
        setNewStop(prev => ({ 
          ...prev, 
          name: `Location (${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})` 
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please enter coordinates manually.');
    }
  };

  // Handle map selection for adding stops
  const handleMapSelection = () => {
    setShowMapSelection(true);
  };

  // Simple long press handler for adding stops
  const handleMapLongPress = (event: any) => {
    if (!showMapSelection) return;
    
    const coordinate = event.nativeEvent.coordinate;
    handleMapTap(coordinate.latitude, coordinate.longitude);
  };

  // Handle map tap to add stop
  const handleMapTap = async (latitude: number, longitude: number) => {
    if (!showMapSelection) {
      return;
    }
    
    try {
      // Try to get place name
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      let placeName = '';
      
      if (places.length > 0) {
        const p = places[0];
        placeName = [p.name, p.street, p.city, p.region].filter(Boolean).join(', ');
      }
      
      if (!placeName) {
        placeName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }
      
      // Add the stop directly
      const stop = {
        id: Date.now().toString(),
        name: placeName,
        latitude: latitude,
        longitude: longitude,
        status: 'pending' as const,
        requiredWaitTime: 5 // 5 minutes default
      };
      
      setTripStops(prev => [...prev, stop]);
      setShowMapSelection(false);
      
      Alert.alert('Stop Added', `Added "${placeName}" to your trip stops.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add stop from map selection.');
    }
  };

  // Start the trip
  const startTrip = async () => {
    if (tripStops.length === 0) {
      Alert.alert('No Stops', 'Please add at least one stop before starting the trip.');
      return;
    }
    
    setTripStarted(true);
    setTracking(true);
    setLocationHistory([]);
    
    // Start GPS tracking every 30 seconds
    intervalRef.current = setInterval(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let loc = await Location.getCurrentPositionAsync({});
      const currentTime = Date.now();
      
      // Update current location state with latest GPS data
      setLocation(loc.coords);
      
      setLocationHistory(prev => [
        ...prev,
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: currentTime }
      ]);
      setLastGpsDebug({ timestamp: currentTime, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      
      // Update current location
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (places.length > 0) {
          const p = places[0];
          const placeName = [p.name, p.street, p.city, p.region].filter(Boolean).join(', ');
          setCurrentLocation(placeName);
        }
      } catch (e) {
        setCurrentLocation(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
      
      // Check proximity to stops and update status
      checkStopProximity(loc.coords.latitude, loc.coords.longitude, currentTime);
    }, 30000); // 30 seconds
  };

  // Stop the trip
  const stopTrip = () => {
    setTripStarted(false);
    setTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Check if current location is near any stops
  const checkStopProximity = (currentLat: number, currentLng: number, currentTime: number) => {
    setTripStops(prev => prev.map(stop => {
      const distance = getDistance(
        { latitude: currentLat, longitude: currentLng },
        { latitude: stop.latitude, longitude: stop.longitude }
      );
      
      // If within 50 meters of a stop
      if (distance <= 50) {
        if (stop.status === 'pending') {
          // Just reached the stop
          return {
            ...stop,
            status: 'reached',
            reachedAt: currentTime
          };
        } else if (stop.status === 'reached') {
          // Check if waited long enough
          const waitTime = (currentTime - (stop.reachedAt || currentTime)) / (1000 * 60); // minutes
          if (waitTime >= stop.requiredWaitTime) {
            return {
              ...stop,
              status: 'completed',
              completedAt: currentTime,
              actualWaitTime: waitTime
            };
          }
        }
      } else {
        // If moved away from a reached stop without completing
        if (stop.status === 'reached') {
          const waitTime = (currentTime - (stop.reachedAt || currentTime)) / (1000 * 60);
          if (waitTime < stop.requiredWaitTime) {
            return {
              ...stop,
              status: 'overdue'
            };
          }
        }
      }
      
      return stop;
    }));
  };

  if (activeTrips.length === 0) {
    return (
      <View style={styles.container}>
        <Navbar title="Trip Tracking" notificationCount={unreadNotifications} />
        <View style={styles.emptyContainer}>
          <MapPin size={48} color="#DC2626" />
          <Text style={styles.emptyText}>No active trips</Text>
          <Text style={styles.emptySubtext}>
            Start a trip to begin tracking
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Tracking</Text>
        <Text style={styles.headerSubtitle}>
          {selectedTrip ? `Trip #${selectedTrip.id}` : 'No active trip'}
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Map Section - 1/2 of screen height */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Live Location</Text>
          {location ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              followsUserLocation={true}
              onLongPress={(event) => {
                if (showMapSelection) {
                  handleMapLongPress(event);
                }
              }}
            >
              {/* Current location marker */}
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Current Location"
                  description={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                  pinColor="red"
                />
              )}
              
              {/* Show last GPS position if different from current location */}
              {lastGpsDebug && location && (
                Math.abs(lastGpsDebug.latitude - location.latitude) > 0.000001 || 
                Math.abs(lastGpsDebug.longitude - location.longitude) > 0.000001
              ) && (
                <Marker
                  coordinate={{
                    latitude: lastGpsDebug.latitude,
                    longitude: lastGpsDebug.longitude,
                  }}
                  title="Last GPS Position"
                  description={`${lastGpsDebug.latitude.toFixed(6)}, ${lastGpsDebug.longitude.toFixed(6)}`}
                  pinColor="orange"
                />
              )}
              
              {/* Trip stops markers */}
              {tripStops.map((stop) => (
                <Marker
                  key={stop.id}
                  coordinate={{
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                  }}
                  title={stop.name}
                  description={`Status: ${stop.status}`}
                  pinColor={
                    stop.status === 'completed' ? 'green' :
                    stop.status === 'reached' ? 'blue' :
                    stop.status === 'overdue' ? 'red' :
                    'red'
                  }
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapText}>Getting Location...</Text>
              <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 10 }} />
            </View>
          )}
          <View style={styles.mapInfo}>
            <Text style={styles.mapSubtext}>
              {lastGpsDebug ? 
                `Last GPS: ${lastGpsDebug.latitude.toFixed(6)}, ${lastGpsDebug.longitude.toFixed(6)}` : 
                'No GPS data yet'
              }
            </Text>
            <Text style={styles.mapSubtext}>
              GPS Collection: {tracking ? 'Active' : 'Inactive'} 
              {tracking && ` (${GPS_INTERVAL_SECONDS}s intervals)`}
            </Text>
            {showMapSelection && (
              <Text style={styles.mapSelectionText}>
                🎯 Long press to add a stop
              </Text>
            )}
          </View>
        </View>

        {/* Remove All Stops Button */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <TouchableOpacity
            style={styles.removeAllButton}
            onPress={() => setTripStops([])}
            disabled={tripStops.length === 0}
          >
            <Text style={styles.removeAllButtonText}>Remove All Stops</Text>
          </TouchableOpacity>
        </View>

        {/* Route Tracker - Compact horizontal */}
        {selectedTrip && tripStops.length > 0 && (
          <RouteTracker 
            route={tripStops.map(stop => ({
              name: stop.name,
              status: stop.status,
              reachedAt: stop.reachedAt,
              completedAt: stop.completedAt,
              duration: stop.actualWaitTime
            }))} 
            currentLocation={currentLocation}
          />
        )}

        {/* Trip Status */}
        {selectedTrip && (
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Trip Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Start Time</Text>
                <Text style={styles.statusValue}>
                  {selectedTrip.actualDeparture ? 
                    new Date(selectedTrip.actualDeparture).toLocaleTimeString() : 
                    'Not started'
                  }
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Duration</Text>
                <Text style={styles.statusValue}>
                  {tripStarted ? 
                    `${Math.round((Date.now() - (selectedTrip?.actualDeparture?.getTime() || Date.now())) / (1000 * 60))} min` : 
                    '0 min'
                  }
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Stops Visited</Text>
                <Text style={styles.statusValue}>
                  {tripStops.filter(stop => stop.status !== 'pending').length}/{tripStops.length}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Completed Stops</Text>
                <Text style={styles.statusValue}>
                  {tripStops.filter(stop => stop.status === 'completed').length}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stops Management */}
        <View style={styles.stopsManagementContainer}>
          <Text style={styles.sectionTitle}>Trip Stops</Text>
          
          {tripStops.length === 0 ? (
            <View style={styles.noStopsContainer}>
              <Text style={styles.noStopsText}>No stops added yet</Text>
              <Text style={styles.noStopsSubtext}>Add stops to begin your trip</Text>
            </View>
          ) : (
            <View style={styles.stopsList}>
              {tripStops.map((stop, index) => (
                <View key={stop.id} style={styles.stopItem}>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopNumber}>{index + 1}</Text>
                    <View style={styles.stopDetails}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <Text style={styles.stopCoords}>
                        {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stopStatus}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(stop.status) }
                    ]}>
                      {stop.status === 'overdue' && <Text style={styles.overdueSymbol}>✕</Text>}
                    </View>
                    <Text style={styles.statusText}>{stop.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.addStopButton, { flex: 1, marginRight: 8 }]}
              onPress={() => setShowAddStopModal(true)}
            >
              <Text style={styles.addStopButtonText}>+ Add Stop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addStopButton, styles.showMapButton, { flex: 1, marginLeft: 8 }]}
              onPress={handleMapSelection}
            >
              <Text style={styles.addStopButtonText}>🗺️ Show on Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Controls - Single button */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              tripStarted ? styles.stopButton : styles.startButton
            ]} 
            onPress={tripStarted ? stopTrip : startTrip}
          >
            <Text style={styles.buttonText}>
              {tripStarted ? 'Stop Trip' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Stop Modal */}
      <Modal
        visible={showAddStopModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Stop</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Stop Name (e.g., Central Station)"
              value={newStop.name}
              onChangeText={(text) => setNewStop(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Latitude (e.g., 12.9716)"
              value={newStop.latitude}
              onChangeText={(text) => setNewStop(prev => ({ ...prev, latitude: text }))}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Longitude (e.g., 77.5946)"
              value={newStop.longitude}
              onChangeText={(text) => setNewStop(prev => ({ ...prev, longitude: text }))}
              keyboardType="decimal-pad"
            />
            
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.currentLocationButtonText}>📍 Use Current Location</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddStopModal(false);
                  setNewStop({ name: '', latitude: '', longitude: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={addStop}
              >
                <Text style={styles.addButtonText}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 16,
    paddingTop: 25,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: '#64748B' },
  scrollContainer: { flex: 1 },
  mapContainer: {
    height: (screenHeight * 2) / 3,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  mapText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  mapInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mapSubtext: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },
  statusContainer: { marginTop: 16, paddingHorizontal: 16 },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusItem: { flex: 1, alignItems: 'center' },
  statusLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  statusValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  controlsContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 20, 
    backgroundColor: 'transparent', 
    alignItems: 'center',
    marginTop: 16
  },
  button: { backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 16, alignItems: 'center', padding: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startButton: { backgroundColor: '#059669' },
  stopButton: { backgroundColor: '#059669' },
  pauseButton: { backgroundColor: '#059669' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Stops Management Styles
  stopsManagementContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noStopsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noStopsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noStopsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stopsList: {
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  stopDetails: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stopCoords: {
    fontSize: 12,
    color: '#6B7280',
  },
  stopStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueSymbol: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  addStopButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  showMapButton: {
    backgroundColor: '#10B981',
  },
  addStopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3B82F6',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  currentLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionModeIndicator: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  selectionModeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  mapSelectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FF6B35',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  removeAllButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    opacity: 1,
  },
  removeAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});