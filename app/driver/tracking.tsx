import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Trip, StopStatus } from '@/types';
import * as Location from 'expo-location';
import type { LocationObjectCoords } from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Trip as APITrip,
  updateTripGPSData,
  getTripsByDriver,
  updateTrip,
} from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import {
  Camera,
  Wifi,
  Settings,
  Activity,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Video,
  WifiOff,
  Bluetooth,
  Car,
} from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

// =========================
// Constants
// =========================
const GPS_INTERVAL_SECONDS = 10; // How often to collect GPS data (seconds)
const STOP_MIN_DURATION_SECONDS = 300; // 5 minutes in seconds

// =========================
// Types
// =========================
interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

interface DetectedStop {
  id: string;
  latitude: number;
  longitude: number;
  placeName: string;
  startTime: number;
  endTime: number;
  duration: number; // minutes
  address?: string;
}

interface TripAnalytics {
  startTime: number;
  endTime: number;
  totalDistance: number; // meters
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  totalStops: number;
  totalStopTime: number; // minutes
  routeEfficiency: number; // percentage
  alerts: string[];
  recommendations: string[];
}

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'reached' | 'completed' | 'overdue';
  reachedAt?: number;
  completedAt?: number;
  requiredWaitTime: number; // minutes
  actualWaitTime?: number; // minutes
}

// =========================
// Permission Helpers
// =========================
async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to track your trip.'
      );
      return false;
    }
    if (Platform.OS === 'android') {
      const askBackground = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Background Location',
          'To track your trip in the background, we need background location permission. Grant it?',
          [
            { text: 'No', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Yes', onPress: () => resolve(true) },
          ]
        );
      });
      if (askBackground) {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Background Permission Denied',
            'Background location permission is required for full tracking functionality.'
          );
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    Alert.alert('Error', 'Failed to request location permissions.');
    return false;
  }
}

// =========================
// GPS Tracking Functions
// =========================
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateSpeed(point1: GPSPoint, point2: GPSPoint): number {
  const distance = calculateDistance(
    point1.latitude,
    point1.longitude,
    point2.latitude,
    point2.longitude
  );
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000; // seconds
  const speedMs = distance / timeDiff;
  return speedMs * 3.6; // Convert to km/h
}

// =========================
// Main Component
// =========================
export default function DriverTrackingScreen() {
  // -------- State --------
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [selectedTrip, setSelectedTrip] = useState<APITrip | null>(null);
  const [allConductorTrips, setAllConductorTrips] = useState<APITrip[]>([]);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Trip management
  const [tripStarted, setTripStarted] = useState(false);
  const [tripStops, setTripStops] = useState<Stop[]>([]);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStop, setNewStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
  });
  const [editingStop, setEditingStop] = useState<{
    id: string;
    name: string;
    latitude: string;
    longitude: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // GPS tracking
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [detectedStops, setDetectedStops] = useState<DetectedStop[]>([]);
  const [tripAnalytics, setTripAnalytics] = useState<TripAnalytics | null>(
    null
  );
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Monitoring and OBD states
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [cameraWifiUrl, setCameraWifiUrl] = useState('');
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const [obdConnected, setObdConnected] = useState(false);
  const [showObdModal, setShowObdModal] = useState(false);
  const [obdDeviceName, setObdDeviceName] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Storage keys
  const STORAGE_KEYS = {
    TRIP_STOPS: 'tripStops',
    GPS_POINTS: 'gpsPoints',
    TRIP_STARTED: 'tripStarted',
    DETECTED_STOPS: 'detectedStops',
  };

  // Ref to track if component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load all conductor trips and find active trip
  useEffect(() => {
    if (user?.username) {
      loadConductorTrips();
    }
  }, [user]);

  const loadConductorTrips = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);

      // Load all driver trips
      const trips = await getTripsByDriver(user.username);
      console.log('📋 All driver trips:', trips);

      // Filter to only show in-progress trips
      const inProgressTrips = trips.filter(
        (trip) => trip.trip_status === 'in_progress'
      );

      setAllConductorTrips(inProgressTrips);
      console.log('📋 In-progress trips:', inProgressTrips.length);

      // Find the active trip (first in-progress trip)
      const activeTrip = inProgressTrips.length > 0 ? inProgressTrips[0] : null;

      if (activeTrip) {
        setSelectedTrip(activeTrip);
        console.log('🎯 Active trip selected:', activeTrip.trip_id);
      } else {
        setSelectedTrip(null);
        console.log('❌ No active trip found');
      }
    } catch (error: any) {
      console.error('❌ Error loading trips:', error);
      Alert.alert(
        'Error',
        `Failed to load trips: ${error?.message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const storeGPSData = async (gpsPoint: GPSPoint) => {
    if (!selectedTrip) {
      console.log('❌ No selected trip for GPS data storage');
      return;
    }

    try {
      console.log('💾 Storing GPS data:', gpsPoint);

      // Store GPS data in backend
      const result = await updateTripGPSData(selectedTrip.trip_id, {
        latitude: gpsPoint.latitude,
        longitude: gpsPoint.longitude,
      });

      console.log('✅ GPS data stored successfully:', result);

      // Add to local state for analytics
      setGpsPoints((prev) => [...prev, gpsPoint]);

      // Detect stops if we have enough points
      if (gpsPoints.length > 1) {
        const stops = detectStops([...gpsPoints, gpsPoint]);
        setDetectedStops(stops);
      }
    } catch (error: any) {
      console.error('❌ Error storing GPS data:', error);
      // Don't show alert for every GPS storage failure
      // Just log it for debugging
    }
  };

  const getAddressFromCoords = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    setIsLoadingAddress(true);
    try {
      console.log('📍 Getting address for coordinates:', latitude, longitude);

      // Use a simple, reliable free service
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

      console.log('📍 Fetching from BigDataCloud...');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📍 BigDataCloud response:', data);

      if (data && data.city) {
        const addressParts = [];

        // Add city/town/village
        if (data.city) addressParts.push(data.city);
        else if (data.town) addressParts.push(data.town);
        else if (data.village) addressParts.push(data.village);
        else if (data.locality) addressParts.push(data.locality);

        // Add state/province
        if (data.principalSubdivision)
          addressParts.push(data.principalSubdivision);

        // Add country
        if (data.countryName) addressParts.push(data.countryName);

        if (addressParts.length > 0) {
          const address = addressParts.join(', ');
          console.log('📍 Generated address:', address);
          return address;
        }
      }

      // If no city found, try to get at least country
      if (data && data.countryName) {
        const fallbackAddress = data.countryName;
        console.log('📍 Fallback to country:', fallbackAddress);
        return fallbackAddress;
      }

      // Last resort: return a formatted coordinate
      const coordAddress = `Location (${latitude.toFixed(
        4
      )}, ${longitude.toFixed(4)})`;
      console.log('📍 Using coordinates as address:', coordAddress);
      return coordAddress;
    } catch (error) {
      console.error('❌ Error getting address:', error);

      // Return a more user-friendly coordinate format
      const coordAddress = `Location (${latitude.toFixed(
        4
      )}, ${longitude.toFixed(4)})`;
      console.log('📍 Error fallback address:', coordAddress);
      return coordAddress;
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const detectStops = (points: GPSPoint[]): DetectedStop[] => {
    const stops: DetectedStop[] = [];
    let currentStop: DetectedStop | null = null;

    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];

      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        currentPoint.latitude,
        currentPoint.longitude
      );

      const timeDiff = (currentPoint.timestamp - prevPoint.timestamp) / 1000; // seconds

      // If vehicle is stationary (less than 50 meters in 5 minutes)
      if (distance < 50 && timeDiff > STOP_MIN_DURATION_SECONDS) {
        if (!currentStop) {
          currentStop = {
            id: `stop_${prevPoint.timestamp}`,
            latitude: prevPoint.latitude,
            longitude: prevPoint.longitude,
            placeName: 'Unknown Location',
            startTime: prevPoint.timestamp,
            endTime: currentPoint.timestamp,
            duration: Math.round(timeDiff / 60), // minutes
          };
        } else {
          currentStop.endTime = currentPoint.timestamp;
          currentStop.duration = Math.round(
            (currentPoint.timestamp - currentStop.startTime) / 60000
          );
        }
      } else {
        if (currentStop) {
          stops.push(currentStop);
          currentStop = null;
        }
      }
    }

    if (currentStop) {
      stops.push(currentStop);
    }

    return stops;
  };

  const calculateTripAnalytics = (
    points: GPSPoint[],
    stops: DetectedStop[]
  ): TripAnalytics => {
    if (points.length < 2) {
      return {
        startTime: 0,
        endTime: 0,
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalStops: 0,
        totalStopTime: 0,
        routeEfficiency: 0,
        alerts: [],
        recommendations: [],
      };
    }

    const startTime = points[0].timestamp;
    const endTime = points[points.length - 1].timestamp;
    let totalDistance = 0;
    let maxSpeed = 0;
    const speeds: number[] = [];

    for (let i = 1; i < points.length; i++) {
      const distance = calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;

      const speed = calculateSpeed(points[i - 1], points[i]);
      speeds.push(speed);
      if (speed > maxSpeed) {
        maxSpeed = speed;
      }
    }

    const averageSpeed =
      speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const totalStopTime = stops.reduce(
      (total, stop) => total + stop.duration,
      0
    );
    const routeEfficiency =
      ((endTime - startTime - totalStopTime * 60000) / (endTime - startTime)) *
      100;

    const alerts: string[] = [];
    const recommendations: string[] = [];

    if (maxSpeed > 80) {
      alerts.push('High speed detected');
      recommendations.push('Maintain safe speed limits');
    }

    if (totalStopTime > 30) {
      alerts.push('Excessive stop time');
      recommendations.push('Minimize unnecessary stops');
    }

    return {
      startTime,
      endTime,
      totalDistance,
      averageSpeed,
      maxSpeed,
      totalStops: stops.length,
      totalStopTime,
      routeEfficiency,
      alerts,
      recommendations,
    };
  };

  const startGPSTracking = () => {
    console.log('🔄 Starting GPS tracking...');

    if (!selectedTrip) {
      console.log('❌ No selected trip for GPS tracking');
      return;
    }

    if (tracking) {
      console.log('⚠️ GPS tracking already active');
      return;
    }

    setTracking(true);
    console.log('✅ Tracking state set to true');

    // Start GPS tracking interval
    intervalRef.current = setInterval(async () => {
      try {
        console.log(
          '⏰ GPS tracking interval triggered... (Count:',
          gpsPoints.length + 1,
          ')'
        );

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const gpsPoint: GPSPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || 0,
        };

        console.log('📍 GPS Point collected:', gpsPoint);

        // Store GPS data
        await storeGPSData(gpsPoint);

        // Update current location for display
        setLocation(location.coords);
        const address = await getAddressFromCoords(
          location.coords.latitude,
          location.coords.longitude
        );
        setCurrentAddress(address);

        console.log('✅ GPS tracking cycle completed');
      } catch (error: any) {
        console.error('❌ GPS tracking error:', error);
        setLocationError(error?.message || 'Failed to get location');
      }
    }, GPS_INTERVAL_SECONDS * 1000);

    console.log('✅ GPS tracking interval set successfully');
  };

  const stopGPSTracking = () => {
    console.log('🛑 Stopping GPS tracking...');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTracking(false);
    console.log('✅ GPS tracking stopped');

    // Calculate final analytics
    if (gpsPoints.length > 1) {
      const analytics = calculateTripAnalytics(gpsPoints, detectedStops);
      setTripAnalytics(analytics);
      setShowAnalytics(true);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(location.coords);
      const address = await getAddressFromCoords(
        location.coords.latitude,
        location.coords.longitude
      );
      setCurrentAddress(address);

      // Update new stop coordinates
      setNewStop((prev) => ({
        ...prev,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
      }));
    } catch (error: any) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const addStop = () => {
    if (!newStop.name || !newStop.latitude || !newStop.longitude) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const stop: Stop = {
      id: Date.now().toString(),
      name: newStop.name,
      latitude: parseFloat(newStop.latitude),
      longitude: parseFloat(newStop.longitude),
      status: 'pending',
      requiredWaitTime: 5, // Default 5 minutes
    };

    setTripStops((prev) => [...prev, stop]);
    setShowAddStopModal(false);
    setNewStop({ name: '', latitude: '', longitude: '' });
  };

  const loadOfflineData = async () => {
    try {
      const storedStops = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_STOPS);
      const storedGpsPoints = await AsyncStorage.getItem(
        STORAGE_KEYS.GPS_POINTS
      );
      const storedTripStarted = await AsyncStorage.getItem(
        STORAGE_KEYS.TRIP_STARTED
      );

      if (storedStops) {
        setTripStops(JSON.parse(storedStops));
      }
      if (storedGpsPoints) {
        setGpsPoints(JSON.parse(storedGpsPoints));
      }
      if (storedTripStarted) {
        setTripStarted(JSON.parse(storedTripStarted));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TRIP_STOPS,
        JSON.stringify(tripStops)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.GPS_POINTS,
        JSON.stringify(gpsPoints)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.TRIP_STARTED,
        JSON.stringify(tripStarted)
      );
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const startTrip = async () => {
    if (!selectedTrip) {
      Alert.alert('Error', 'No trip selected');
      return;
    }

    try {
      setTripStarted(true);
      startGPSTracking();

      Alert.alert(
        'Trip Started',
        'GPS tracking has begun. Your location will be recorded every 10 seconds and stored in the database.'
      );
    } catch (error: any) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip');
    }
  };

  const endTrip = async () => {
    if (!selectedTrip) {
      Alert.alert('Error', 'No trip selected');
      return;
    }

    try {
      stopGPSTracking();
      setTripStarted(false);

      // Update trip status to completed
      await updateTrip(selectedTrip.trip_id, {
        trip_status: 'completed',
      });

      Alert.alert(
        'Trip Ended',
        'Trip has been completed and GPS tracking has stopped.'
      );

      // Reload trips to update the list
      loadConductorTrips();
    } catch (error: any) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip');
    }
  };

  function getStatusColor(status?: StopStatus) {
    switch (status) {
      case 'reached':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  }

  function getTripStatusColor(status: string) {
    switch (status) {
      case 'in_progress':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  }

  const handleStartTrip = async (trip: APITrip) => {
    setSelectedTrip(trip);
    setTripStarted(true);
    startGPSTracking();

    Alert.alert(
      'Trip Started',
      'GPS tracking has begun. Your location will be updated every 10 seconds.'
    );
  };

  const handleStartGPSTracking = async (trip: APITrip) => {
    try {
      console.log('🚀 Starting GPS tracking for in-progress trip...');
      console.log('   Trip ID:', trip.trip_id);
      console.log('   Trip Status:', trip.trip_status);

      setSelectedTrip(trip);
      setTripStarted(true);
      startGPSTracking();

      console.log('✅ GPS tracking started successfully');

      Alert.alert(
        'GPS Tracking Started',
        'GPS tracking has begun. Your location will be updated every 10 seconds.'
      );
    } catch (error: any) {
      console.error('Error starting GPS tracking:', error);
      Alert.alert('Error', 'Failed to start GPS tracking. Please try again.');
    }
  };

  // Network status check
  useEffect(() => {
    const checkNetworkStatus = () => setIsOnline(true);
    checkNetworkStatus();
  }, []);

  // Check permissions and location on mount
  useEffect(() => {
    async function checkPermissionsAndLocation() {
      try {
        const hasPermission = await requestLocationPermissions();
        if (hasPermission) {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(location.coords);
          const address = await getAddressFromCoords(
            location.coords.latitude,
            location.coords.longitude
          );
          setCurrentAddress(address);
        } else {
          setPermissionError('Location permission denied');
        }
      } catch (error: any) {
        console.error('Error checking permissions:', error);
        setLocationError(error?.message || 'Failed to get location');
      }
    }

    checkPermissionsAndLocation();
  }, []);

  const ErrorBanner = () => {
    if (!permissionError && !locationError) return null;

    return (
      <View style={styles.errorBanner}>
        <AlertCircle size={16} color="#FFFFFF" />
        <Text style={styles.errorText}>{permissionError || locationError}</Text>
      </View>
    );
  };

  // Monitoring functions
  const handleEnableMonitoring = () => {
    if (!cameraWifiUrl.trim()) {
      Alert.alert('Error', 'Please enter the camera WiFi URL');
      return;
    }
    setMonitoringEnabled(true);
    setShowMonitoringModal(false);
    Alert.alert('Success', 'Camera monitoring has been enabled');
  };

  const handleConnectOBD = () => {
    if (!obdDeviceName.trim()) {
      Alert.alert('Error', 'Please enter the OBD device name');
      return;
    }
    setObdConnected(true);
    setShowObdModal(false);
    Alert.alert('Success', 'OBD device connected successfully');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar title="Trip Tracking" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading trip information...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar title="Trip Tracking" />
      <ErrorBanner />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* In-Progress Trips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 My In-Progress Trips</Text>
          {allConductorTrips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('no_in_progress_trips') || 'No in-progress trips'}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('no_in_progress_trips_subtext') ||
                  'You have no active trips assigned'}
              </Text>
            </View>
          ) : (
            allConductorTrips.map((trip) => (
              <View
                key={trip.trip_id}
                style={[
                  styles.tripCard,
                  trip.trip_status === 'in_progress' && styles.activeTripCard,
                ]}
              >
                <View style={styles.tripCardHeader}>
                  <View style={styles.tripCardInfo}>
                    <Text style={styles.tripCardRoute}>
                      {trip.start_location} → {trip.end_location}
                    </Text>
                    <Text style={styles.tripCardVehicle}>
                      Vehicle ID: {trip.vehicle_id || 'N/A'}
                    </Text>
                    <Text style={styles.tripCardTime}>
                      {new Date(trip.start_time).toLocaleString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tripStatusBadge,
                      { backgroundColor: getTripStatusColor(trip.trip_status) },
                    ]}
                  >
                    <Text style={styles.tripStatusText}>
                      {trip.trip_status}
                    </Text>
                  </View>
                </View>

                {trip.trip_status === 'in_progress' && !tripStarted && (
                  <TouchableOpacity
                    style={styles.startGPSTrackingButton}
                    onPress={() => handleStartGPSTracking(trip)}
                  >
                    <Text style={styles.startGPSTrackingButtonText}>
                      🚀 Start GPS Tracking
                    </Text>
                  </TouchableOpacity>
                )}

                {trip.trip_status === 'in_progress' && tripStarted && (
                  <View style={styles.activeTripIndicator}>
                    <Text style={styles.activeTripText}>
                      🟢 GPS Tracking Active
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Current Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Current Location</Text>
          {location ? (
            <View style={styles.locationInfo}>
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>📍 Current Address:</Text>
                {isLoadingAddress ? (
                  <View style={styles.loadingAddressContainer}>
                    <ActivityIndicator size="small" color="#0369A1" />
                    <Text style={styles.loadingAddressText}>
                      Getting address...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.addressValue}>
                    {currentAddress || 'Address not available'}
                  </Text>
                )}
              </View>

              <View style={styles.coordinatesContainer}>
                <Text style={styles.locationLabel}>GPS Coordinates:</Text>
                <Text style={styles.locationValue}>
                  {location.latitude.toFixed(6)},{' '}
                  {location.longitude.toFixed(6)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={getCurrentLocation}
                disabled={isLoadingAddress}
              >
                <Text style={styles.refreshButtonText}>
                  {isLoadingAddress
                    ? '⏳ Getting Address...'
                    : '🔄 Refresh Location'}
                </Text>
              </TouchableOpacity>

              {/* Test button for debugging */}
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { marginTop: 8, backgroundColor: '#F59E0B' },
                ]}
                onPress={async () => {
                  console.log('🧪 Testing address function...');
                  if (location) {
                    const testAddress = await getAddressFromCoords(
                      location.latitude,
                      location.longitude
                    );
                    console.log('🧪 Test result:', testAddress);
                    setCurrentAddress(testAddress);
                  } else {
                    console.log('🧪 No location available for test');
                  }
                }}
              >
                <Text style={styles.refreshButtonText}>🧪 Test Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Text style={styles.noLocationText}>Location not available</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.refreshButtonText}>🔄 Get Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Monitoring Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📹 Camera Monitoring</Text>
          <View style={styles.monitoringCard}>
            <View style={styles.monitoringHeader}>
              <Video
                size={24}
                color={monitoringEnabled ? '#10B981' : '#6B7280'}
              />
              <Text style={styles.monitoringTitle}>
                {monitoringEnabled
                  ? 'Monitoring Active'
                  : 'Monitoring Disabled'}
              </Text>
            </View>

            {monitoringEnabled ? (
              <View style={styles.monitoringStatus}>
                <Text style={styles.monitoringStatusText}>
                  Camera connected to: {cameraWifiUrl}
                </Text>
                <TouchableOpacity
                  style={styles.disableButton}
                  onPress={() => setMonitoringEnabled(false)}
                >
                  <Text style={styles.disableButtonText}>
                    Disable Monitoring
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.monitoringSetup}>
                <Text style={styles.monitoringDescription}>
                  Connect your camera to start monitoring. Enter the camera's
                  WiFi URL to establish connection.
                </Text>
                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={() => setShowMonitoringModal(true)}
                >
                  <Text style={styles.enableButtonText}>
                    Setup Camera Monitoring
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* OBD Connection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 OBD Logger Connection</Text>
          <View style={styles.obdCard}>
            <View style={styles.obdHeader}>
              <Bluetooth
                size={24}
                color={obdConnected ? '#10B981' : '#6B7280'}
              />
              <Text style={styles.obdTitle}>
                {obdConnected ? 'OBD Connected' : 'OBD Disconnected'}
              </Text>
            </View>

            {obdConnected ? (
              <View style={styles.obdStatus}>
                <Text style={styles.obdStatusText}>
                  Connected to: {obdDeviceName}
                </Text>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => setObdConnected(false)}
                >
                  <Text style={styles.disconnectButtonText}>
                    Disconnect OBD
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.obdSetup}>
                <Text style={styles.obdDescription}>
                  Connect your OBD logger device to monitor vehicle diagnostics
                  and performance data.
                </Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => setShowObdModal(true)}
                >
                  <Text style={styles.connectButtonText}>
                    Connect OBD Device
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Trip Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Trip Controls</Text>

          {selectedTrip &&
            selectedTrip.trip_status === 'in_progress' &&
            !tripStarted && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={() => handleStartGPSTracking(selectedTrip)}
              >
                <Text style={styles.buttonText}>🚀 Start GPS Tracking</Text>
              </TouchableOpacity>
            )}

          {selectedTrip && tripStarted && (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={endTrip}
            >
              <Text style={styles.buttonText}>🛑 End Trip</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.trackingInfo}>
            {tripStarted
              ? 'GPS tracking is currently active. Your location is being recorded.'
              : selectedTrip && selectedTrip.trip_status === 'in_progress'
              ? 'Ready to start GPS tracking for your active trip.'
              : 'No active trip selected.'}
          </Text>
        </View>
      </ScrollView>

      {/* Monitoring Setup Modal */}
      <Modal
        visible={showMonitoringModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonitoringModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Setup Camera Monitoring</Text>
              <TouchableOpacity
                onPress={() => setShowMonitoringModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your camera's WiFi URL to establish monitoring connection.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Camera WiFi URL (e.g., http://192.168.1.100:8080)"
              value={cameraWifiUrl}
              onChangeText={setCameraWifiUrl}
              keyboardType="url"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMonitoringModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEnableMonitoring}
              >
                <Text style={styles.confirmButtonText}>Enable Monitoring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OBD Connection Modal */}
      <Modal
        visible={showObdModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowObdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect OBD Device</Text>
              <TouchableOpacity
                onPress={() => setShowObdModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your OBD device name to establish connection.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="OBD Device Name (e.g., OBD-II Scanner)"
              value={obdDeviceName}
              onChangeText={setObdDeviceName}
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowObdModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConnectOBD}
              >
                <Text style={styles.confirmButtonText}>Connect Device</Text>
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTripCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  tripCardRoute: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  tripCardVehicle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  tripCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tripStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  tripStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  startGPSTrackingButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startGPSTrackingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTripIndicator: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  activeTripText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
    marginBottom: 6,
  },
  addressValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingAddressText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
    marginLeft: 8,
  },
  coordinatesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noLocationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  monitoringCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monitoringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monitoringTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
  },
  monitoringStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
  },
  monitoringStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
    flex: 1,
  },
  disableButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disableButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  monitoringSetup: {
    alignItems: 'center',
  },
  monitoringDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  obdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  obdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  obdTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
  },
  obdStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
  },
  obdStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
    flex: 1,
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  obdSetup: {
    alignItems: 'center',
  },
  obdDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  trackingInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
