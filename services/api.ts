import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '@/types';

// IMPORTANT: Update this IP address to match your development machine's IP
// You can find your IP by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
const API_BASE_URL = 'http://192.168.0.150:3001/api';

// Alternative IP addresses to try if the above doesn't work:
// const API_BASE_URL = 'http://10.0.2.2:3001/api'; // For Android emulator
// const API_BASE_URL = 'http://localhost:3001/api'; // For iOS simulator
// const API_BASE_URL = 'http://YOUR_ACTUAL_IP:3001/api'; // Replace with your actual IP

// Enhanced request function with better error handling
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 Making request to: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Request successful: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${endpoint}`, error);

    // More specific error messages
    if (
      error instanceof TypeError &&
      error.message.includes('Network request failed')
    ) {
      throw new Error(
        `Network connection failed - please check your internet connection and server status. URL: ${url}`
      );
    }

    throw error;
  }
};

export interface TripCreateData {
  vehicle_id: number;
  start_time: string;
  start_location: string;
  driver_username: string;
  manager_username: string;
  end_time?: string;
  end_location?: string;
  distance_travelled?: number;
  average_speed?: number;
  max_speed?: number;
  min_speed?: number;
  fuel_consumed?: number;
  harsh_events_count?: number;
  trip_status?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface TripUpdateData {
  vehicle_id?: number;
  start_time?: string;
  end_time?: string;
  start_location?: string;
  end_location?: string;
  distance_travelled?: number;
  average_speed?: number;
  max_speed?: number;
  min_speed?: number;
  fuel_consumed?: number;
  harsh_events_count?: number;
  trip_status?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  driver_username?: string;
  manager_username?: string;
}

export interface LocationUpdateData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface GPSData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  address?: string;
}

export interface Driver {
  id: number;
  username: string;
  manager_username?: string;
  organisation?: string;
  date_of_birth?: string;
  mobile_number?: number;
  address?: string;
  license_number?: string;
  license_expire_date?: string;
  blood_group?: string;
  verification_status?: string;
  emergency_contact_number?: number;
  gender?: string;
  // Legacy properties for backward compatibility
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'on_trip';
  rating?: number;
  total_trips?: number;
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  vehicle_id: number;
  license_plate: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  status: string;
  location?: string;
  image_url?: string;
  accidents?: number;
  km_driven?: number;
  remaining_fuel?: number;
  tire_pressure?: number;
  service_date?: string;
  inspection_date?: string;
  service_type?: string;
  manager_username: string;
  created_at: string;
  updated_at: string;
}

// Request Interceptor - adds headers and token
const requestInterceptor = async (url: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
  console.log('📤 Headers:', headers);
  if (options.body) {
    console.log('📤 Body:', options.body);
  }

  return {
    ...options,
    headers,
  };
};

// Response Interceptor - handles responses and errors
const responseInterceptor = async (response: Response, url: string) => {
  console.log(
    `📥 API Response: ${response.status} ${response.statusText} - ${url}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `❌ API Error: ${response.status} ${response.statusText}`,
      errorText
    );

    // Handle specific error cases
    if (response.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      throw new Error('Authentication failed. Please login again.');
    }

    if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log('📥 Response Data:', data);
  return data;
};

// Main API function
export const api = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // Apply request interceptor
    const interceptedOptions = await requestInterceptor(url, options);

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...interceptedOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Apply response interceptor
    return await responseInterceptor(response, url);
  } catch (error: any) {
    console.error('🔥 Network Error:', error);

    if (error.name === 'AbortError') {
      throw new Error(
        'Request timeout - please check your internet connection'
      );
    }

    if (error.message.includes('Network request failed')) {
      throw new Error(
        'Network connection failed - please check your internet connection and server status'
      );
    }

    throw error;
  }
};

// Trip API Functions using the main api function

/**
 * Create a new trip
 */
export const createTrip = async (tripData: TripCreateData): Promise<Trip> => {
  const response = await api('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
  return response.data;
};

/**
 * Get all trips
 */
export const getAllTrips = async (): Promise<Trip[]> => {
  const response = await api('/trips');
  return response.data;
};

/**
 * Get trips by manager username
 */
export const getTripsByManager = async (username: string): Promise<Trip[]> => {
  const response = await api(`/trips/manager/${username}`);
  return response.data;
};

/**
 * Get in-progress trips by manager username
 */
export const getInProgressTripsByManager = async (
  username: string
): Promise<Trip[]> => {
  const response = await api(`/trips/manager/${username}`);
  // Filter for in_progress trips on the frontend
  return response.data.filter(
    (trip: Trip) => trip.trip_status === 'in_progress'
  );
};

/**
 * Get trips by driver username
 */
export const getTripsByDriver = async (username: string): Promise<Trip[]> => {
  const response = await api(`/trips/driver/${username}`);
  return response.data;
};

/**
 * Get current active trips for a driver
 */
export const getCurrentTripsOfDriver = async (
  username: string
): Promise<Trip[]> => {
  const response = await api(`/trips/current/${username}`);
  return response.data;
};

/**
 * Get trip by ID
 */
export const getTripById = async (id: number): Promise<Trip> => {
  const response = await api(`/trips/${id}`);
  return response.data;
};

/**
 * Update trip details
 */
export const updateTrip = async (
  id: number,
  updateData: TripUpdateData
): Promise<Trip> => {
  const response = await api(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  return response.data;
};

/**
 * Delete a trip
 */
export const deleteTrip = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  return await api(`/trips/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Search trips by location
 */
export const searchTripsByLocation = async (
  location: string
): Promise<Trip[]> => {
  const response = await api(`/trips/search/location/${location}`);
  return response.data;
};

/**
 * Update trip status
 */
export const updateTripStatus = async (
  id: number,
  status: string
): Promise<Trip> => {
  const response = await api(`/trips/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response.data;
};

/**
 * Update driver's GPS location by username
 */
export const updateDriverLocation = async (
  username: string,
  locationData: LocationUpdateData
): Promise<Trip> => {
  const response = await api(`/trips/driver/${username}/location`, {
    method: 'PUT',
    body: JSON.stringify(locationData),
  });
  return response.data;
};

/**
 * Update GPS data for a trip
 */
export const updateTripGPSData = async (
  id: number,
  gpsData: GPSData
): Promise<Trip> => {
  const response = await api(`/trips/${id}/gps`, {
    method: 'PUT',
    body: JSON.stringify(gpsData),
  });
  return response.data;
};

/**
 * Get all active drivers with their trips
 */
export const getAllDriversWithTrips = async (): Promise<any[]> => {
  const response = await api('/trips/drivers/active');
  return response.data;
};

/**
 * Get all trips with driver information
 */
export const getAllTripsWithDriverInfo = async (): Promise<Trip[]> => {
  const response = await api('/trips/drivers/all');
  return response.data;
};

// Driver API Functions

/**
 * Get drivers by manager username
 */
export const getDriversByManager = async (
  managerUsername: string
): Promise<Driver[]> => {
  try {
    const response = await api(`/drivers/manager/${managerUsername}`);
    return response;
  } catch (error) {
    console.error('Error fetching drivers by manager:', error);
    throw error;
  }
};

/**
 * Get available drivers
 */
export const getAvailableDrivers = async (): Promise<Driver[]> => {
  try {
    const response = await api('/drivers/available');
    return response.data;
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    throw error;
  }
};

/**
 * Get driver details
 */
export const getDriverDetails = async (username: string): Promise<Driver> => {
  try {
    const response = await api(`/drivers/username/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver details:', error);
    throw error;
  }
};

/**
 * Test API connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🌐 Testing connection to:', API_BASE_URL);

    // First try a simple ping to the base URL
    const pingUrl = API_BASE_URL.replace('/api', '');
    console.log('🔍 Pinging base URL:', pingUrl);

    const pingResponse = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('📡 Ping response status:', pingResponse.status);

    // Then try the health endpoint
    const healthResponse = await api('/health');
    console.log('✅ API connection successful');
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error);

    // More specific error information
    if (
      error instanceof TypeError &&
      error.message.includes('Network request failed')
    ) {
      console.error('🔍 Network issue detected. Please check:');
      console.error(
        '   1. Is your backend server running? (npm start in startrit_backend)'
      );
      console.error(
        '   2. Are you on the same WiFi network as your development machine?'
      );
      console.error('   3. Is the IP address correct? Current:', API_BASE_URL);
      console.error('   4. Is port 3001 accessible?');
    }

    return false;
  }
};

/**
 * Simple ping test without authentication
 */
export const pingServer = async (): Promise<boolean> => {
  try {
    const pingUrl = API_BASE_URL.replace('/api', '');
    console.log('🏓 Pinging server at:', pingUrl);

    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('🏓 Ping response:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('🏓 Ping failed:', error);
    return false;
  }
};

/**
 * Get server health status
 */
export const getServerHealth = async (): Promise<any> => {
  return await api('/health');
};

/**
 * Get server info for debugging
 */
export const getServerInfo = () => {
  return {
    baseUrl: API_BASE_URL,
    isHttps: API_BASE_URL.startsWith('https'),
    isLocal:
      API_BASE_URL.includes('192.168.0.132') ||
      API_BASE_URL.includes('localhost'),
  };
};

// Vehicle API Functions

export const getVehiclesByManager = async (
  managerUsername: string
): Promise<any[]> => {
  const response = await api(`/vehicles/manager/${managerUsername}`);
  // The backend now returns a consistent response format with data property
  return response.data || [];
};

// Additional Vehicle API Functions
export const getAllVehicles = async (): Promise<any[]> => {
  const response = await api('/vehicles');
  return response.data || [];
};

export const getVehicleById = async (id: number): Promise<any> => {
  const response = await api(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (vehicleData: any): Promise<any> => {
  const response = await api('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
  return response.data;
};

export const updateVehicle = async (
  id: number,
  vehicleData: any
): Promise<any> => {
  const response = await api(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  });
  return response.data;
};

export const deleteVehicle = async (id: number): Promise<any> => {
  const response = await api(`/vehicles/${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const getAvailableVehicles = async (): Promise<any[]> => {
  const response = await api('/vehicles/available');
  return response.data || [];
};

export const getVehicleStatus = async (id: number): Promise<any> => {
  const response = await api(`/vehicles/status/${id}`);
  return response.data;
};

export const searchVehiclesByType = async (type: string): Promise<any[]> => {
  const response = await api(`/vehicles/type/${type}`);
  return response.data || [];
};

// Driver API Functions - Additional functions
export const createDriver = async (driverData: any): Promise<any> => {
  const response = await api('/drivers', {
    method: 'POST',
    body: JSON.stringify(driverData),
  });
  return response.data;
};

export const updateDriver = async (
  id: number,
  driverData: any
): Promise<any> => {
  const response = await api(`/drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(driverData),
  });
  return response.data;
};

export const deleteDriver = async (id: number): Promise<any> => {
  const response = await api(`/drivers/${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const searchDriversByName = async (name: string): Promise<any[]> => {
  const response = await api(`/drivers/search/name/${name}`);
  return response.data || [];
};

export const getDriverById = async (id: number): Promise<any> => {
  const response = await api(`/drivers/${id}`);
  return response.data;
};

export const getDriverScores = async (id: number): Promise<any> => {
  const response = await api(`/drivers/${id}/scores`);
  return response.data;
};

export const getDriverScoresByUsername = async (
  username: string
): Promise<any> => {
  const response = await api(`/drivers/username/${username}/scores`);
  return response.data;
};

export const getAllDriverScores = async (): Promise<any[]> => {
  const response = await api('/drivers/scores');
  return response.data || [];
};

// Driver Authentication Functions
export const signupDriver = async (driverData: any): Promise<any> => {
  const response = await api('/drivers/auth/signup', {
    method: 'POST',
    body: JSON.stringify(driverData),
  });
  return response.data;
};

export const loginDriver = async (credentials: {
  email: string;
  password: string;
}): Promise<any> => {
  const response = await api('/drivers/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.data;
};

export const getDriverProfile = async (): Promise<any> => {
  const response = await api('/drivers/auth/me');
  return response.data;
};

// Export types
export { Trip };
