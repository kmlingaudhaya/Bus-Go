import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '@/types';

const API_BASE_URL = 'http://192.168.0.132:3001/api';

// Types
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
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  blood_group: string;
  address: string;
  status: 'active' | 'inactive' | 'on_trip';
  rating: number;
  total_trips: number;
  join_date: string;
  manager_username: string;
  created_at: string;
  updated_at: string;
}

// Request Interceptor - adds headers and token
const requestInterceptor = async (url: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
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
  console.log(`📥 API Response: ${response.status} ${response.statusText} - ${url}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
    
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
    
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
      throw new Error('Request timeout - please check your internet connection');
    }
    
    if (error.message.includes('Network request failed')) {
      throw new Error('Network connection failed - please check your internet connection and server status');
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
export const getInProgressTripsByManager = async (username: string): Promise<Trip[]> => {
  const response = await api(`/trips/manager/${username}`);
  // Filter for in_progress trips on the frontend
  return response.data.filter((trip: Trip) => trip.trip_status === 'in_progress');
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
export const getCurrentTripsOfDriver = async (username: string): Promise<Trip[]> => {
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
export const updateTrip = async (id: number, updateData: TripUpdateData): Promise<Trip> => {
  const response = await api(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  return response.data;
};

/**
 * Delete a trip
 */
export const deleteTrip = async (id: number): Promise<{ success: boolean; message: string }> => {
  return await api(`/trips/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Search trips by location
 */
export const searchTripsByLocation = async (location: string): Promise<Trip[]> => {
  const response = await api(`/trips/search/location/${location}`);
  return response.data;
};

/**
 * Update trip status
 */
export const updateTripStatus = async (id: number, status: string): Promise<Trip> => {
  const response = await api(`/trips/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response.data;
};

/**
 * Update driver's GPS location by username
 */
export const updateDriverLocation = async (username: string, locationData: LocationUpdateData): Promise<Trip> => {
  const response = await api(`/trips/driver/${username}/location`, {
    method: 'PUT',
    body: JSON.stringify(locationData),
  });
  return response.data;
};

/**
 * Update GPS data for a trip
 */
export const updateTripGPSData = async (id: number, gpsData: GPSData): Promise<Trip> => {
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
export const getDriversByManager = async (managerUsername: string): Promise<Driver[]> => {
  try {
    const response = await api(`/drivers/manager/${managerUsername}`);
    return response.data;
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
    console.log('Testing connection to:', API_BASE_URL);
    await api('/health');
    console.log('✅ API connection successful');
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
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
    isLocal: API_BASE_URL.includes('192.168.0.132') || API_BASE_URL.includes('localhost'),
  };
};

// Vehicle API Functions

export const getVehiclesByManager = async (managerUsername: string): Promise<any[]> => {
  const response = await api(`/vehicles/manager/${managerUsername}`);
  // The backend now returns a consistent response format with data property
  return response.data || [];
};

// Export types
export { Trip };