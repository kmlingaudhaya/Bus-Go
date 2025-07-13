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
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!isMounted.current) return;

        const newPoint: GPSPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
          accuracy: loc.coords.accuracy || 0,
        };

        setGpsPoints((prev) => [...prev, newPoint]);
        setLocation(loc.coords);

        // Get address for display
        const address = await getAddressFromCoords(
          loc.coords.latitude,
          loc.coords.longitude
        );
        setCurrentAddress(address);
      } catch (error) {
        console.error('GPS tracking error:', error);
      }
    }, GPS_INTERVAL_SECONDS * 1000);
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
    const granted = await requestLocationPermissions();
    if (!granted) return;

    setTripStarted(true);
    setTracking(true);
    startGPSTracking();
    Alert.alert(
      'Trip Started',
      'GPS tracking has begun. Your location will be recorded every 10 seconds.'
    );
  };

  // Helper: End trip
  const endTrip = () => {
    stopGPSTracking();
    setTripStarted(false);
    setTracking(false);
    Alert.alert(
      'Trip Ended',
      'Trip analysis is ready. Check the analytics below.'
    );
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

  return (
    <View style={styles.container}>
      <ErrorBanner />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Tracking</Text>
        <Text style={styles.headerSubtitle}>
          {selectedTrip ? `Trip #${selectedTrip.id}` : 'No active trip'}
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
                  🔄 Refresh Location
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <Text style={styles.locationText}>Getting Location...</Text>
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
                  {tripStarted ? '🟢 Active' : '⚪ Inactive'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>GPS Points</Text>
                <Text style={styles.statusValue}>{gpsPoints.length}</Text>
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
              <Text style={styles.noStopsText}>No stops added yet</Text>
              <Text style={styles.noStopsSubtext}>
                Add stops to begin your trip
              </Text>
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
                        <Text style={styles.editButtonText}>edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Stop',
                            `Are you sure you want to delete "${stop.name}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
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
                        <Text style={styles.deleteButtonText}>delete</Text>
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
            <Text style={styles.addStopButtonText}>+ Add Stop</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              tripStarted ? styles.stopButton : styles.startButton,
            ]}
            onPress={tripStarted ? endTrip : startTrip}
          >
            <Text style={styles.buttonText}>
              {tripStarted ? 'End Trip' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.trackingInfo}>
            {tripStarted
              ? 'GPS tracking active - collecting data every 10 seconds'
              : 'Click start to begin GPS tracking and stop detection'}
          </Text>
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
              onChangeText={(text) =>
                setNewStop((prev) => ({ ...prev, name: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Latitude (e.g., 12.9716)"
              value={newStop.latitude}
              onChangeText={(text) =>
                setNewStop((prev) => ({ ...prev, latitude: text }))
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Longitude (e.g., 77.5946)"
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
                Use Current Location
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

      {/* Edit Stop Modal */}
      <Modal
        visible={!!editingStop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingStop(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Stop</Text>

            <TextInput
              style={styles.input}
              placeholder="Stop Name"
              value={editingStop?.name || ''}
              onChangeText={(text) =>
                setEditingStop((prev) =>
                  prev ? { ...prev, name: text } : prev
                )
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Latitude"
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
              placeholder="Longitude"
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
                Use Current Location
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingStop(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
                <Text style={styles.addButtonText}>Save Changes</Text>
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
});
