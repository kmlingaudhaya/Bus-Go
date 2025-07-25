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
import { conductorAPI, Trip as APITrip } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

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
export default function ConductorTrackingScreen() {
  // -------- State --------
  const { user } = useAuth();
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
  const [gpsIntervalCount, setGpsIntervalCount] = useState(0);

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
      const token = await AsyncStorage.getItem('token');
      if (token) {
        conductorAPI.setToken(token);
      }

      // Load all conductor trips
      const trips = await conductorAPI.getConductorTrips(user.username);
      console.log('📋 All conductor trips:', trips);

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
        console.log('📋 Found in-progress trip:', activeTrip.trip_id);
        console.log('   Trip status:', activeTrip.trip_status);
        console.log('   Trip started state:', tripStarted);
        console.log('   Waiting for conductor to start GPS tracking...');
      } else {
        console.log('📋 No in-progress trips found');
        setSelectedTrip(null);
      }
    } catch (error: any) {
      console.error('Error loading conductor trips:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Store GPS data in database
  const storeGPSData = async (gpsPoint: GPSPoint) => {
    if (!selectedTrip) {
      console.log('❌ No selected trip, skipping GPS data storage');
      return;
    }

    try {
      console.log('🔄 Attempting to store GPS data...');
      console.log('   Selected Trip ID:', selectedTrip.trip_id);
      console.log('   GPS Point:', gpsPoint);

      // Calculate speed if we have previous points
      let speed = 0;
      if (gpsPoints.length > 0) {
        const prevPoint = gpsPoints[gpsPoints.length - 1];
        speed = calculateSpeed(prevPoint, gpsPoint);
      }

      const gpsData = {
        vehicle_id: selectedTrip.vehicle_id,
        trip_id: selectedTrip.trip_id,
        latitude: gpsPoint.latitude,
        longitude: gpsPoint.longitude,
        speed: speed,
        heading: 0, // We can calculate this later if needed
        address: currentAddress, // Include the current address
      };

      console.log('📤 Sending GPS data to backend:', gpsData);

      // Store GPS data in trips table using API
      const result = await conductorAPI.storeGPSData(gpsData);

      console.log('✅ GPS data stored successfully in trips table');
      console.log('   Backend response:', result);
      console.log('   Trip ID:', selectedTrip.trip_id);
      console.log(
        '   Coordinates:',
        `${gpsPoint.latitude}, ${gpsPoint.longitude}`
      );
      console.log('   Speed:', speed.toFixed(2), 'km/h');
      console.log('   Timestamp:', new Date(gpsPoint.timestamp).toISOString());
    } catch (error: any) {
      console.error('❌ Error storing GPS data:', error);
      console.error('   Error details:', error?.message || 'Unknown error');
    }
  };

  // Helper: Get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      // Try using LocationIQ API (free tier available)
      const apiKey = 'pk.d9fa7499a00623bdcb585d286e703272'; // Your LocationIQ API key
      const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${latitude.toFixed(
        6
      )}&lon=${longitude.toFixed(6)}&format=json&addressdetails=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.display_name) {
        // Show the raw address as received from the API
        return ` ${data.display_name}`;
      }

      // Fallback: Try using BigDataCloud API (free, no API key required)
      const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude.toFixed(
        6
      )}&longitude=${longitude.toFixed(6)}&localityLanguage=en`;

      try {
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json();

        if (fallbackData && fallbackData.locality) {
          // Show the raw address data
          const rawAddress = `${fallbackData.locality}, ${fallbackData.city}, ${fallbackData.countryName}`;
          return ` ${rawAddress}`;
        }
      } catch (fallbackError) {
        console.error('Fallback geocoding failed:', fallbackError);
      }

      // Second fallback: Try using Positionstack API (free tier available)
      const secondFallbackUrl = `http://api.positionstack.com/v1/reverse?access_key=YOUR_POSITIONSTACK_KEY&query=${latitude.toFixed(
        6
      )},${longitude.toFixed(6)}`;

      try {
        const secondFallbackResponse = await fetch(secondFallbackUrl);
        const secondFallbackData = await secondFallbackResponse.json();

        if (secondFallbackData.data && secondFallbackData.data.length > 0) {
          const result = secondFallbackData.data[0];
          return ` ${result.label || result.name}`;
        }
      } catch (secondFallbackError) {
        console.error('Second fallback geocoding failed:', secondFallbackError);
      }

      // Final fallback: Return coordinates with a more user-friendly format
      return ` Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    } catch (error) {
      console.error('Error getting address:', error);
      return ` Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };

  // Helper: Detect stops from GPS data
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

      // If distance is less than 50 meters, consider it a potential stop
      if (distance < 50) {
        if (!currentStop) {
          currentStop = {
      id: Date.now().toString(),
            latitude: currentPoint.latitude,
            longitude: currentPoint.longitude,
            placeName: `Stop ${stops.length + 1}`,
            startTime: prevPoint.timestamp,
            endTime: currentPoint.timestamp,
            duration: 0,
          };
        } else {
          currentStop.endTime = currentPoint.timestamp;
        }
      } else {
        if (currentStop) {
          const duration =
            (currentStop.endTime - currentStop.startTime) / (1000 * 60); // minutes
          if (duration >= 5) {
            // Only count stops longer than 5 minutes
            currentStop.duration = duration;
            stops.push(currentStop);
          }
          currentStop = null;
        }
      }
    }

    return stops;
  };

  // Helper: Calculate trip analytics
  const calculateTripAnalytics = (
    points: GPSPoint[],
    stops: DetectedStop[]
  ): TripAnalytics => {
    if (points.length < 2) {
      return {
        startTime: Date.now(),
        endTime: Date.now(),
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
      if (speed > maxSpeed) maxSpeed = speed;
    }

    const averageSpeed =
      speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const totalStopTime = stops.reduce((sum, stop) => sum + stop.duration, 0);
    const totalDuration =
      (points[points.length - 1].timestamp - points[0].timestamp) / (1000 * 60); // minutes
    const routeEfficiency =
      totalDuration > 0
        ? ((totalDuration - totalStopTime) / totalDuration) * 100
        : 0;

    const alerts: string[] = [];
    const recommendations: string[] = [];

    if (averageSpeed < 30) {
      alerts.push('Average speed is below recommended threshold (30 km/h)');
    }
    if (maxSpeed > 80) {
      alerts.push('Maximum speed exceeded recommended limit (80 km/h)');
    }
    if (totalStopTime > totalDuration * 0.3) {
      alerts.push('Excessive stop time detected');
    }

    if (averageSpeed < 30) {
      recommendations.push('Consider optimizing route for better speed');
    }
    if (stops.length > 10) {
      recommendations.push('Too many stops detected - review route efficiency');
    }

    return {
      startTime: points[0].timestamp,
      endTime: points[points.length - 1].timestamp,
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

  // Helper: Start GPS tracking
  const startGPSTracking = () => {
    console.log('🔄 Starting GPS tracking...');
    console.log('   GPS Interval:', GPS_INTERVAL_SECONDS, 'seconds');
    console.log('   Selected Trip:', selectedTrip?.trip_id);
    console.log('   Trip Started:', tripStarted);
    console.log('   Tracking:', tracking);

    if (intervalRef.current) {
      console.log('🔄 Clearing existing interval...');
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      const newCount = gpsIntervalCount + 1;
      setGpsIntervalCount(newCount);
      console.log(
        '⏰ GPS tracking interval triggered... (Count:',
        newCount,
        ')'
      );
      console.log('   Selected Trip:', selectedTrip?.trip_id);
      console.log('   Trip Started:', tripStarted);
      console.log('   Is Mounted:', isMounted.current);
      console.log('   Interval ID:', intervalRef.current);

      try {
        console.log('📍 Getting current location...');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('📍 Location obtained:', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        });

        if (!isMounted.current) {
          console.log('❌ Component not mounted, skipping GPS update');
          return;
        }

        const newPoint: GPSPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
          accuracy: loc.coords.accuracy || 0,
        };

        console.log('📍 New GPS point created:', newPoint);
        setGpsPoints((prev) => [...prev, newPoint]);
        setLocation(loc.coords);

        // Get address for display
        console.log('📍 Getting address from coordinates...');
        const address = await getAddressFromCoords(
          loc.coords.latitude,
          loc.coords.longitude
        );
        setCurrentAddress(address);
        console.log('📍 Address obtained:', address);

        // Update conductor location in trips table every 10 seconds
        console.log('📍 Checking conditions for backend update...');
        console.log('   Selected Trip exists:', !!selectedTrip);
        console.log('   Trip Started:', tripStarted);

        if (selectedTrip && tripStartedRef.current) {
          console.log('✅ Conditions met, updating backend...');
          try {
            console.log('📍 Updating conductor location in trips table...');
            console.log('   Trip ID:', selectedTrip.trip_id);
            console.log(
              '   Coordinates:',
              `${loc.coords.latitude}, ${loc.coords.longitude}`
            );
            console.log('   Address:', address);
            console.log('   Timestamp:', new Date().toISOString());

            await conductorAPI.updateConductorLocation({
              trip_id: selectedTrip.trip_id,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              address: address,
            });
            console.log('✅ Conductor location updated successfully');

            // Also store GPS data in trips table every 10 seconds
            console.log(
              `🚀 Sending GPS data to backend for trip ${selectedTrip.trip_id}:`,
              newPoint
            );
            await storeGPSData(newPoint);
          } catch (error) {
            console.error('❌ Failed to update location in backend:', error);
          }
        } else {
          console.log('❌ Conditions not met for backend update:');
          console.log('   Selected Trip:', selectedTrip?.trip_id);
          console.log('   Trip Started:', tripStarted);
        }
      } catch (error) {
        console.error('❌ GPS tracking error:', error);
      }
    }, GPS_INTERVAL_SECONDS * 1000);

    console.log('✅ GPS tracking interval set successfully');
  };

  // Helper: Stop GPS tracking and analyze trip
  const stopGPSTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Detect stops and calculate analytics
    const stops = detectStops(gpsPoints);
    setDetectedStops(stops);

    const analytics = calculateTripAnalytics(gpsPoints, stops);
    setTripAnalytics(analytics);
    setShowAnalytics(true);
  };

  // Helper: Get current location for adding stops
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission not granted');
        Alert.alert('Permission Error', 'Location permission not granted');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setNewStop((prev) => ({
        ...prev,
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
      }));
      setLocationError(null);
    } catch (error: any) {
      setLocationError(error.message || 'Failed to get location');
      Alert.alert('Location Error', error.message || 'Failed to get location');
    }
  };

  // Helper: Add a new stop
  const addStop = () => {
    const lat = parseFloat(newStop.latitude);
    const lng = parseFloat(newStop.longitude);
    if (newStop.name && !isNaN(lat) && !isNaN(lng)) {
      const stop: Stop = {
        id: Date.now().toString(),
        name: newStop.name,
        latitude: lat,
        longitude: lng,
        status: 'pending',
        requiredWaitTime: 5,
      };
      setTripStops((prev) => [...prev, stop]);
      setNewStop({ name: '', latitude: '', longitude: '' });
      setShowAddStopModal(false);
    } else {
      Alert.alert(
        'Invalid Input',
        'Please enter a valid name, latitude, and longitude.'
      );
    }
  };

  // Helper: Load offline data
  const loadOfflineData = async () => {
    try {
      const savedTripStops = await AsyncStorage.getItem(
        STORAGE_KEYS.TRIP_STOPS
      );
      const savedGpsPoints = await AsyncStorage.getItem(
        STORAGE_KEYS.GPS_POINTS
      );
      const savedTripStarted = await AsyncStorage.getItem(
        STORAGE_KEYS.TRIP_STARTED
      );
      const savedDetectedStops = await AsyncStorage.getItem(
        STORAGE_KEYS.DETECTED_STOPS
      );

      if (savedTripStops) setTripStops(JSON.parse(savedTripStops));
      if (savedGpsPoints) setGpsPoints(JSON.parse(savedGpsPoints));
      if (savedTripStarted) setTripStarted(JSON.parse(savedTripStarted));
      if (savedDetectedStops) setDetectedStops(JSON.parse(savedDetectedStops));
    } catch (error) {
      console.log('Failed to load offline data:', error);
    }
  };

  // Helper: Save offline data
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
      await AsyncStorage.setItem(
        STORAGE_KEYS.DETECTED_STOPS,
        JSON.stringify(detectedStops)
      );
    } catch (error) {
      console.log('Failed to save offline data:', error);
    }
  };

  // Helper: Start trip
  const startTrip = async () => {
    if (!selectedTrip) {
      Alert.alert('Error', 'No trip selected. Please select a trip first.');
        return;
      }

    const granted = await requestLocationPermissions();
    if (!granted) return;

    try {
      // Update trip status to in_progress
      await conductorAPI.updateTripStatus(selectedTrip.trip_id, 'in_progress');

      setTripStarted(true);
      setTracking(true);
      startGPSTracking();
      Alert.alert(
        'Trip Started',
        'GPS tracking has begun. Your location will be recorded every 10 seconds and stored in the database.'
      );
    } catch (error: any) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Helper: End trip
  const endTrip = async () => {
    if (!selectedTrip) return;

    try {
      console.log('🛑 Ending trip...');
      console.log('   Trip ID:', selectedTrip.trip_id);
      console.log('   Total GPS Points:', gpsPoints.length);

      // GPS data is already being stored every 10 seconds in the trips table
      // No need to store it again here since it's already updated in real-time
      if (gpsPoints.length > 0) {
        console.log(
          '📊 GPS data has been continuously updated in trips table during the trip'
        );
        console.log('   Final GPS point count:', gpsPoints.length);
      }

      // Update trip status to completed
      console.log('🛑 Calling API to update trip status to completed...');
      console.log('   Trip ID:', selectedTrip.trip_id);

      const statusUpdateResult = await conductorAPI.updateTripStatus(
        selectedTrip.trip_id,
        'completed'
      );
      console.log('✅ Trip status update API response:', statusUpdateResult);

      // Update local state to reflect completed status
      setSelectedTrip((prev) =>
        prev ? { ...prev, trip_status: 'completed' } : null
      );
      setAllConductorTrips((prev) =>
        prev.filter((trip) => trip.trip_id !== selectedTrip.trip_id)
      );

      stopGPSTracking();
      setTripStarted(false);
      setTracking(false);

      Alert.alert(
        'Trip Ended',
        'Trip completed successfully. All GPS data has been stored for analysis.'
      );
    } catch (error: any) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  // Helper: Get status color
  function getStatusColor(status?: StopStatus) {
    switch (status) {
      case 'pending':
        return '#D1D5DB';
      case 'reached':
        return '#DC2626';
      case 'completed':
        return '#10B981';
      case 'overdue':
        return '#EF4444';
      default:
        return '#D1D5DB';
    }
  }

  // Helper: Get trip status color
  function getTripStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'scheduled':
        return '#D1FAE5';
      case 'in_progress':
        return '#DBEAFE';
      case 'completed':
        return '#F3F4F6';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  }

  // Helper: Handle start trip
  const handleStartTrip = async (trip: APITrip) => {
    try {
      console.log('🚀 Starting new trip...');
      console.log('   Trip ID:', trip.trip_id);
      console.log('   Vehicle ID:', trip.vehicle_id);

      // Update trip status to in_progress
      await conductorAPI.updateTripStatus(trip.trip_id, 'in_progress');

      // Update local state
      setAllConductorTrips((prev) =>
        prev.map((t) =>
          t.trip_id === trip.trip_id ? { ...t, trip_status: 'in_progress' } : t
        )
      );

      // Clear previous GPS data and set as selected trip
      console.log('🔄 Setting up GPS tracking...');
      console.log('   Previous tripStarted:', tripStarted);
      console.log('   Previous tracking:', tracking);
      setGpsPoints([]);
      setSelectedTrip(trip);
      setTripStarted(true);
      setTracking(true);
      console.log('🔄 Starting GPS tracking function...');
      startGPSTracking();
      console.log('🔄 GPS tracking setup complete');
      console.log('   New tripStarted should be: true');
      console.log('   New tracking should be: true');

      console.log('✅ Trip started successfully');
      Alert.alert(
        'Trip Started',
        'GPS tracking has begun. Your location will be updated every 10 seconds.'
      );
    } catch (error: any) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Helper: Handle start GPS tracking for in-progress trip
  const handleStartGPSTracking = async (trip: APITrip) => {
    try {
      console.log('🚀 Starting GPS tracking for in-progress trip...');
      console.log('   Trip ID:', trip.trip_id);
      console.log('   Vehicle ID:', trip.vehicle_id);

      // Clear previous GPS data and set as selected trip
      setGpsPoints([]);
      setSelectedTrip(trip);
      setTripStarted(true);
      setTracking(true);
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

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Save offline data when relevant state changes
  useEffect(() => {
    saveOfflineData();
  }, [tripStops, gpsPoints, tripStarted, detectedStops]);

  // Check network status periodically
  useEffect(() => {
    const checkNetworkStatus = () => setIsOnline(true);
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial location check
  useEffect(() => {
    let cancelled = false;
    async function checkPermissionsAndLocation() {
      try {
        const granted = await requestLocationPermissions();
        if (cancelled) return;
        if (granted) {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            if (cancelled) return;
            setLocation(loc.coords);
            setLocationError(null);

            // Get initial address
            const address = await getAddressFromCoords(
              loc.coords.latitude,
              loc.coords.longitude
            );
            setCurrentAddress(address);
          } catch (e) {
            if (cancelled) return;
            setLocationError('Failed to get location');
            setPermissionError('Failed to get location');
          }
        } else {
          if (cancelled) return;
          setLocationError('Location permission not granted');
          setPermissionError('Location permission not granted');
        }
      } catch (error) {
        if (cancelled) return;
        setPermissionError('Failed to request permissions');
      }
    }
    checkPermissionsAndLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  // Error banner component
  const ErrorBanner = () => {
    if (!permissionError && !locationError) return null;
    return (
      <View
        style={{
          backgroundColor: '#FECACA',
          padding: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#B91C1C', fontWeight: 'bold' }}>
          {permissionError || locationError}
        </Text>
      </View>
    );
  };

  // After: const [tripStarted, setTripStarted] = useState(false);
  const tripStartedRef = useRef(tripStarted);
  useEffect(() => {
    tripStartedRef.current = tripStarted;
  }, [tripStarted]);

  const { t, language } = useLanguage();

  if (loading) {
  return (
    <View style={styles.container}>
      <ErrorBanner />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading trip information...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorBanner />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Tracking</Text>
        <Text style={styles.headerSubtitle}>
          {selectedTrip ? t('trip_number').replace('{id}', String(selectedTrip.trip_id)) : t('no_active_trip')}
        </Text>
        <View
          style={[
            styles.networkStatus,
            { backgroundColor: isOnline ? '#10B981' : '#EF4444' },
          ]}
        >
          <Text style={styles.networkStatusText}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* In-Progress Trips Section */}
        <View style={styles.tripsListContainer}>
          <Text style={styles.sectionTitle}>📋 My In-Progress Trips</Text>
          {allConductorTrips.length === 0 ? (
            <View style={styles.noTripsContainer}>
              <Text style={styles.noTripsText}>{t('no_in_progress_trips')}</Text>
              <Text style={styles.noTripsSubtext}>{t('no_in_progress_trips_subtext')}</Text>
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
                      {t('city_' + trip.start_location)} → {t('city_' + trip.end_location)}
                    </Text>
                    <Text style={styles.tripCardVehicle}>
                      {t('vehicle')}: {trip.vehicle_number || t('na')}
                    </Text>
                    <Text style={styles.tripCardTime}>
                      {new Date(trip.start_time).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                    </Text>
                  </View>
                  <View
                  style={[
                      styles.tripStatusBadge,
                      { backgroundColor: getTripStatusColor(trip.trip_status) },
                  ]}
                >
                    <Text style={styles.tripStatusText}>
                      {t('trip_status_' + trip.trip_status)}
                </Text>
                  </View>
                </View>

                {trip.trip_status === 'in_progress' && !tripStarted && (
              <TouchableOpacity
                    style={styles.startGPSTrackingButton}
                    onPress={() => handleStartGPSTracking(trip)}
                  >
                    <Text style={styles.startGPSTrackingButtonText}>
                      🚀 {t('start_gps_tracking')}
                    </Text>
                  </TouchableOpacity>
                )}

                {trip.trip_status === 'in_progress' && tripStarted && (
                  <View style={styles.activeTripIndicator}>
                    <Text style={styles.activeTripText}>
                      🟢 {t('gps_tracking_active')}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Trip Details Section */}
        {selectedTrip ? (
          <View style={styles.tripDetailsContainer}>
            <Text style={styles.sectionTitle}>🚌 Trip Details</Text>
            <View style={styles.tripInfo}>
              <View style={styles.tripRoute}>
                <Text style={styles.tripRouteLabel}>Route:</Text>
                <Text style={styles.tripRouteValue}>
                  {t('city_' + selectedTrip.start_location)} → {t('city_' + selectedTrip.end_location)}
                </Text>
              </View>

              <View style={styles.tripDetailsRow}>
                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Vehicle:</Text>
                  <Text style={styles.tripDetailValue}>
                    {selectedTrip.vehicle_number || t('na')}
                  </Text>
                </View>

                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Status:</Text>
                <Text
                  style={[
                      styles.tripDetailValue,
                      {
                        color:
                          selectedTrip.trip_status === 'in_progress'
                            ? '#10B981'
                            : '#F59E0B',
                      },
                    ]}
                  >
                    {t('trip_status_' + selectedTrip.trip_status)}
                </Text>
                </View>
              </View>

              <View style={styles.tripDetailsRow}>
                <View style={styles.tripDetailItem}>
                  <Text style={styles.tripDetailLabel}>Start Time:</Text>
                  <Text style={styles.tripDetailValue}>
                    {new Date(selectedTrip.start_time).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                </Text>
            </View>

                {selectedTrip.driver_first_name && (
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Driver:</Text>
                    <Text style={styles.tripDetailValue}>
                      {selectedTrip.driver_first_name}{' '}
                      {selectedTrip.driver_last_name}
                    </Text>
          </View>
        )}
              </View>

              {selectedTrip.distance_travelled && (
                <View style={styles.tripDetailsRow}>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Distance:</Text>
                    <Text style={styles.tripDetailValue}>
                      {selectedTrip.distance_travelled} km
              </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noTripContainer}>
            <Text style={styles.noTripTitle}>{t('no_active_trip')}</Text>
            <Text style={styles.noTripSubtext}>{t('no_active_trip_subtext')}</Text>
            <TouchableOpacity
              style={styles.refreshTripButton}
              onPress={loadConductorTrips}
            >
              <Text style={styles.refreshTripButtonText}>{t('refresh_trips')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Location Section */}
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>📍 Current Location</Text>
          {location ? (
            <View style={styles.locationInfo}>
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>📍 Current Address:</Text>
                <Text style={styles.addressValue}>{currentAddress}</Text>
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
              >
                <Text style={styles.refreshButtonText}>
                  🔄 {t('refresh_location')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <Text style={styles.locationText}>{t('getting_location')}</Text>
              <ActivityIndicator
                size="large"
                color="#DC2626"
                style={{ marginTop: 10 }}
              />
            </View>
          )}
        </View>

        {/* Trip Status */}
        {selectedTrip && (
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Trip Status</Text>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Status</Text>
                    <Text style={styles.statusValue}>
                  {tripStarted ? t('active_status') : t('inactive_status')}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>GPS Points</Text>
                <Text style={styles.statusValue}>{gpsPoints.length}</Text>
                  </View>
                  <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Interval Count</Text>
                <Text style={styles.statusValue}>{gpsIntervalCount}</Text>
                  </View>
                  <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Detected Stops</Text>
                <Text style={styles.statusValue}>{detectedStops.length}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Duration</Text>
                  <Text style={styles.statusValue}>
                  {tripStarted && gpsPoints.length > 0
                      ? `${Math.round(
                        (Date.now() - gpsPoints[0].timestamp) / (1000 * 60)
                        )} min`
                      : '0 min'}
                  </Text>
                </View>
                </View>
          </View>
        )}

        {/* Trip Analytics */}
        {showAnalytics && tripAnalytics && (
          <View style={styles.analyticsContainer}>
            <Text style={styles.sectionTitle}>Trip Analytics</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Total Distance</Text>
                <Text style={styles.analyticsValue}>
                  {(tripAnalytics.totalDistance / 1000).toFixed(2)} km
                </Text>
            </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Average Speed</Text>
                <Text style={styles.analyticsValue}>
                  {tripAnalytics.averageSpeed.toFixed(1)} km/h
                  </Text>
                </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Max Speed</Text>
                <Text style={styles.analyticsValue}>
                  {tripAnalytics.maxSpeed.toFixed(1)} km/h
                  </Text>
                </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Total Stops</Text>
                <Text style={styles.analyticsValue}>
                  {tripAnalytics.totalStops}
                  </Text>
                </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Stop Time</Text>
                <Text style={styles.analyticsValue}>
                  {tripAnalytics.totalStopTime.toFixed(1)} min
                  </Text>
                </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Efficiency</Text>
                <Text style={styles.analyticsValue}>
                  {tripAnalytics.routeEfficiency.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    {/* Alerts */}
            {tripAnalytics.alerts.length > 0 && (
                      <View style={styles.alertsContainer}>
                        <Text style={styles.alertsTitle}>⚠️ Trip Alerts</Text>
                {tripAnalytics.alerts.map((alert, index) => (
                          <Text key={index} style={styles.alertText}>
                            • {alert}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Recommendations */}
            {tripAnalytics.recommendations.length > 0 && (
                      <View style={styles.recommendationsContainer}>
                        <Text style={styles.recommendationsTitle}>
                          💡 Recommendations
                        </Text>
                {tripAnalytics.recommendations.map((rec, index) => (
                          <Text key={index} style={styles.recommendationText}>
                            • {rec}
                          </Text>
                        ))}
                  </View>
                )}
              </View>
            )}

        {/* Detected Stops */}
        {detectedStops.length > 0 && (
          <View style={styles.stopsContainer}>
            <Text style={styles.sectionTitle}>Detected Stops ({'>'}5 min)</Text>
            {detectedStops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                      <View style={styles.stopInfo}>
                        <Text style={styles.stopNumber}>{index + 1}</Text>
                        <View style={styles.stopDetails}>
                          <Text style={styles.stopName}>{stop.placeName}</Text>
                          <Text style={styles.stopCoords}>
                      {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.stopTime}>
                      {new Date(stop.startTime).toLocaleTimeString()} -{' '}
                      {new Date(stop.endTime).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.stopDuration}>
                        <Text style={styles.durationText}>
                    {stop.duration.toFixed(1)} min
                        </Text>
                      </View>
                    </View>
                  ))}
          </View>
        )}

        {/* Manual Stops */}
          <View style={styles.stopsManagementContainer}>
            <Text style={styles.sectionTitle}>Trip Stops</Text>
            {tripStops.length === 0 ? (
              <View style={styles.noStopsContainer}>
                <Text style={styles.noStopsText}>{t('no_stops_added')}</Text>
                <Text style={styles.noStopsSubtext}>{t('add_stops_to_begin_trip')}</Text>
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
                  <View style={styles.stopActions}>
                    <View style={styles.stopStatus}>
                        <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusColor(stop.status) },
                        ]}
                      />
                      <Text style={styles.statusText}>{stop.status}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                          <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                              setEditingStop({
                                id: stop.id,
                                name: stop.name,
                                latitude: stop.latitude.toString(),
                                longitude: stop.longitude.toString(),
                          });
                        }}
                      >
                        <Text style={styles.editButtonText}>{t('edit')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Stop',
                            `Are you sure you want to delete "${stop.name}"?`,
                            [
                              { text: t('cancel'), style: 'cancel' },
                              {
                                text: t('delete'),
                                style: 'destructive',
                                onPress: () => {
                              setTripStops((prev) =>
                                prev.filter((s) => s.id !== stop.id)
                                  );
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                          </TouchableOpacity>
                        </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

              <TouchableOpacity
            style={styles.addStopButton}
                onPress={() => setShowAddStopModal(true)}
              >
                <Text style={styles.addStopButtonText}>{t('add_stop')}</Text>
              </TouchableOpacity>
        </View>

        {/* Trip Controls */}
        <View style={styles.controlsContainer}>
          {/* Debug Info */}
          {selectedTrip && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                {t('debug_trip_status').replace('{status}', selectedTrip.trip_status).replace('{started}', tripStarted.toString())}
              </Text>
            </View>
          )}

          {selectedTrip &&
            selectedTrip.trip_status === 'in_progress' &&
            !tripStarted && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={() => handleStartGPSTracking(selectedTrip)}
              >
                <Text style={styles.buttonText}>🚀 {t('start_gps_tracking')}</Text>
              </TouchableOpacity>
            )}

          {selectedTrip && tripStarted && (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={endTrip}
            >
              <Text style={styles.buttonText}>🛑 {t('end_trip')}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.trackingInfo}>
            {tripStarted
              ? t('gps_tracking_active_info')
              : selectedTrip && selectedTrip.trip_status === 'in_progress'
              ? t('start_gps_tracking_prompt')
              : t('no_in_progress_trip_selected')}
          </Text>

          {/* Debug Button */}
              <TouchableOpacity
                style={[
              styles.button,
              { backgroundColor: '#6B7280', marginTop: 8 },
            ]}
            onPress={() => {
              console.log('🔍 Debug Info:');
              console.log('   Selected Trip:', selectedTrip);
              console.log('   Trip Started:', tripStarted);
              console.log('   Tracking:', tracking);
              console.log('   GPS Points Count:', gpsPoints.length);
              console.log('   All Trips Count:', allConductorTrips.length);
              console.log('   User:', user?.username);
              console.log(
                '   All Trips Statuses:',
                allConductorTrips.map((t) => ({
                  id: t.trip_id,
                  status: t.trip_status,
                }))
              );
              Alert.alert(
                'Debug Info',
                `Selected Trip: ${
                  selectedTrip?.trip_id || 'None'
                }\nTrip Started: ${tripStarted}\nTracking: ${tracking}\nGPS Points: ${
                  gpsPoints.length
                }\nAll Trips: ${allConductorTrips.length}`
              );
            }}
          >
            <Text style={styles.buttonText}>🔍 {t('debug_info')}</Text>
              </TouchableOpacity>

          {/* Manual GPS Test Button */}
          {selectedTrip && (
              <TouchableOpacity
                style={[
                  styles.button,
                { backgroundColor: '#059669', marginTop: 8 },
              ]}
              onPress={async () => {
                try {
                  console.log('�� Testing manual GPS data storage...');
                  const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                  });

                  const testPoint: GPSPoint = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    timestamp: loc.timestamp,
                    accuracy: loc.coords.accuracy || 0,
                  };

                  console.log('🧪 Test GPS Point:', testPoint);
                  console.log('🧪 Selected Trip:', selectedTrip);

                  await storeGPSData(testPoint);
                  Alert.alert(
                    'GPS Test',
                    'Manual GPS data storage test completed! Check console for details.'
                  );
                } catch (error: any) {
                  console.error('❌ Manual GPS test failed:', error);
                  Alert.alert(
                    'GPS Test Error',
                    `Failed to test GPS data storage: ${
                      error?.message || 'Unknown error'
                    }`
                  );
                }
              }}
            >
              <Text style={styles.buttonText}>🧪 {t('test_gps_storage')}</Text>
              </TouchableOpacity>
          )}

          {/* Reset Trip State Button */}
              <TouchableOpacity
                style={[
                  styles.button,
              { backgroundColor: '#DC2626', marginTop: 8 },
            ]}
            onPress={() => {
              setTripStarted(false);
              setTracking(false);
              setGpsPoints([]);
              setDetectedStops([]);
              setTripAnalytics(null);
              setShowAnalytics(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              Alert.alert(
                'Reset Complete',
                'Trip state has been reset. You can now start fresh.'
              );
            }}
          >
            <Text style={styles.buttonText}>🔄 {t('reset_trip_state')}</Text>
              </TouchableOpacity>

          {/* Test Trip Creation Button */}
              <TouchableOpacity
                style={[
                  styles.button,
              { backgroundColor: '#8B5CF6', marginTop: 8 },
            ]}
            onPress={async () => {
              try {
                console.log('🧪 Creating test trip...');
                // This would need to be implemented in your backend
                // For now, just show what we need
                Alert.alert(
                  'Test Trip Info',
                  'To test the system, you need a trip with status "in_progress" assigned to your conductor username. Check the debug info to see your current trips and their statuses.'
                );
              } catch (error) {
                console.error('❌ Test trip creation failed:', error);
                Alert.alert(
                  'Error',
                  'Failed to create test trip. Check console for details.'
                );
              }
            }}
          >
            <Text style={styles.buttonText}>🧪 {t('test_trip_info')}</Text>
              </TouchableOpacity>

          {/* Test Backend GPS Storage Button */}
              <TouchableOpacity
                style={[
                  styles.button,
              { backgroundColor: '#F59E0B', marginTop: 8 },
            ]}
            onPress={async () => {
              try {
                console.log('🧪 Testing backend GPS data storage directly...');

                const response = await fetch(
                  'http://192.168.1.100:3000/api/trips/testGPSData',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}),
                  }
                );

                const result = await response.json();
                console.log('🧪 Backend test result:', result);

                if (result.success) {
                  Alert.alert(
                    'Backend Test Success',
                    'GPS data storage test completed successfully! Check console for details.'
                  );
                } else {
                  Alert.alert(
                    'Backend Test Failed',
                    `Test failed: ${result.error}`
                  );
                }
              } catch (error: any) {
                console.error('❌ Backend GPS test failed:', error);
                Alert.alert(
                  'Backend Test Error',
                  `Failed to test backend: ${error?.message || 'Unknown error'}`
                );
              }
            }}
          >
            <Text style={styles.buttonText}>🧪 {t('test_backend_gps')}</Text>
              </TouchableOpacity>

          {/* Test Trip Status Update Button */}
          {selectedTrip && (
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#8B5CF6', marginTop: 8 },
              ]}
              onPress={async () => {
                try {
                  console.log('🧪 Testing trip status update...');
                  console.log('   Trip ID:', selectedTrip.trip_id);
                  console.log('   Current Status:', selectedTrip.trip_status);

                  const result = await conductorAPI.updateTripStatus(
                    selectedTrip.trip_id,
                    'completed'
                  );
                  console.log('🧪 Trip status update result:', result);

                  Alert.alert(
                    'Trip Status Test',
                    'Trip status update test completed! Check console for details.'
                  );
                } catch (error: any) {
                  console.error('❌ Trip status update test failed:', error);
                  Alert.alert(
                    'Trip Status Test Error',
                    `Failed to update trip status: ${
                      error?.message || 'Unknown error'
                    }`
                  );
                }
              }}
            >
              <Text style={styles.buttonText}>🧪 {t('test_trip_status_update')}</Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.modalTitle}>{t('add_new_stop')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('stop_name_placeholder')}
              value={newStop.name}
              onChangeText={(text) =>
                setNewStop((prev) => ({ ...prev, name: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder={t('latitude_placeholder')}
              value={newStop.latitude}
              onChangeText={(text) =>
                setNewStop((prev) => ({ ...prev, latitude: text }))
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder={t('longitude_placeholder')}
              value={newStop.longitude}
              onChangeText={(text) =>
                setNewStop((prev) => ({ ...prev, longitude: text }))
              }
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.currentLocationButtonText}>
                {t('use_current_location')}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddStopModal(false);
                  setNewStop({ name: '', latitude: '', longitude: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addStop}
              >
                <Text style={styles.addButtonText}>{t('add_stop')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Stop Modal */}
      <Modal
        visible={!!editingStop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingStop(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('edit_stop')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('stop_name_placeholder')}
              value={editingStop?.name || ''}
              onChangeText={(text) =>
                setEditingStop((prev) =>
                  prev ? { ...prev, name: text } : prev
                )
              }
            />

            <TextInput
              style={styles.input}
              placeholder={t('latitude_placeholder')}
              value={editingStop?.latitude || ''}
              onChangeText={(text) =>
                setEditingStop((prev) =>
                  prev ? { ...prev, latitude: text } : prev
                )
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder={t('longitude_placeholder')}
              value={editingStop?.longitude || ''}
              onChangeText={(text) =>
                setEditingStop((prev) =>
                  prev ? { ...prev, longitude: text } : prev
                )
              }
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.currentLocationButtonText}>
                {t('use_current_location')}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingStop(null)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={() => {
                  if (!editingStop) return;
                  const lat = parseFloat(editingStop.latitude);
                  const lng = parseFloat(editingStop.longitude);
                  if (!editingStop.name || isNaN(lat) || isNaN(lng)) {
                    Alert.alert(
                      'Invalid Input',
                      'Please enter a valid name, latitude, and longitude.'
                    );
                    return;
                  }
                  setTripStops((prev) =>
                    prev.map((stop) =>
                      stop.id === editingStop.id
                        ? {
                            ...stop,
                            name: editingStop.name,
                            latitude: lat,
                            longitude: lng,
                          }
                        : stop
                    )
                  );
                  setEditingStop(null);
                }}
              >
                <Text style={styles.addButtonText}>{t('save_changes')}</Text>
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
    padding: 30,
    paddingTop: 60,
  },
  tripDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tripInfo: {
    gap: 12,
  },
  tripRoute: {
    marginBottom: 8,
  },
  tripRouteLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  tripRouteValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 24,
  },
  tripDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  tripDetailItem: {
    flex: 1,
    minWidth: '48%',
  },
  tripDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  tripDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  noTripContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noTripTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  noTripSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  refreshTripButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  refreshTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tripsListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noTripsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noTripsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noTripsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTripCard: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripCardInfo: {
    flex: 1,
  },
  tripCardRoute: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  tripCardVehicle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  tripCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tripStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tripStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  startTripButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTripIndicator: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  activeTripText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  startGPSTrackingButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startGPSTrackingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 16, color: '#64748B' },
  scrollContainer: { flex: 1 },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
    marginBottom: 12,
  },
  locationInfo: {
    gap: 8,
  },
  addressContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: 22,
  },
  coordinatesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  accuracyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  locationValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  analyticsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  stopsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stopsManagementContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#DC2626',
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
  stopTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stopStatus: {
    alignItems: 'center',
  },
  stopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    padding: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  stopDuration: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  addStopButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addStopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: { backgroundColor: '#059669' },
  stopButton: { backgroundColor: '#DC2626' },
  trackingInfo: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  networkStatus: {
    position: 'absolute',
    top: 50,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  alertsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  recommendationsContainer: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#1E40AF',
    marginBottom: 4,
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
    backgroundColor: '#DC2626',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButton: {
    backgroundColor: '#DC2626',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 16,
  },
  debugInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
});
