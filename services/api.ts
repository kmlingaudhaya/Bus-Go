const API_BASE_URL = 'https://safeway-backend-75xq.onrender.com/api';

export interface Trip {
  trip_id: number;
  vehicle_id: number;
  driver_id: number;
  manager_id: number;
  start_time: string;
  end_time?: string;
  start_location?: string;
  end_location?: string;
  distance_travelled?: number;
  average_speed?: number;
  max_speed?: number;
  min_speed?: number;
  fuel_consumed?: number;
  harsh_events_count?: number;
  trip_status: string;
  conductor?: string;
  conductor_username?: string;
  conductor_firstname?: string;
  conductor_lastname?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  vehicle_number?: string;
  driver_first_name?: string;
  driver_last_name?: string;
}

export interface ConductorLocation {
  trip_id: number;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TripStatusUpdate {
  trip_id: number;
  status: string;
}

class ConductorAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log(`Making API request to: ${url}`);
    console.log('Headers:', headers);

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 70000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error: any) {
      console.error('Network Error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      }
      if (error.message.includes('WRONG_VERSION_NUMBER') || error.message.includes('EPROTO')) {
        throw new Error('SSL/Protocol error - please check if the server is running and accessible');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error('Network connection failed - please check your internet connection and server status');
      }
      throw error;
    }
  }

  // Get trips assigned to a conductor
  async getConductorTrips(username: string): Promise<Trip[]> {
    console.log('🔍 Fetching trips for conductor:', username);
    try {
      const trips = await this.request(`/trips/conductor/${username}`);
      console.log('✅ Conductor trips fetched successfully:', trips);
      return trips;
    } catch (error: any) {
      console.error('❌ Error fetching conductor trips:', error);
      if (error.message.includes('Failed to fetch conductor')) {
        console.log('💡 This might mean the conductor has no trips assigned or the username is not found');
      }
      throw error;
    }
  }

  // Get current active trip for a conductor
  async getCurrentActiveTrip(username: string): Promise<Trip | null> {
    return this.request(`/trips/conductor/${username}/current`);
  }

  // Update trip status
  async updateTripStatus(tripId: number, status: string): Promise<any> {
    return this.request('/trips/updateTripStatus', {
      method: 'POST',
      body: JSON.stringify({ trip_id: tripId, status }),
    });
  }

  // Update conductor GPS location
  async updateConductorLocation(location: ConductorLocation): Promise<any> {
    return this.request('/trips/updateConductorLocation', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  // Store GPS data in trips table
  async storeGPSData(gpsData: {
    vehicle_id: number;
    trip_id: number;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    address?: string;
  }): Promise<any> {
    return this.request('/trips/updateGPSData', {
      method: 'POST',
      body: JSON.stringify(gpsData),
    });
  }

  // Get all conductors with their trip information (for staff view)
  async getAllConductorsWithTrips(): Promise<any[]> {
    return this.request('/trips/conductorsWithTrips');
  }

  // Get all trips with conductor information (for staff view)
  async getAllTripsWithConductorInfo(): Promise<Trip[]> {
    return this.request('/trips/withConductorInfo');
  }

  // Get all trips (for debugging)
  async getAllTrips(): Promise<Trip[]> {
    try {
      console.log('🔍 Fetching all trips for debugging...');
      const trips = await this.request('/trips');
      console.log('✅ All trips fetched:', trips.length, 'trips found');
      return trips;
    } catch (error) {
      console.error('❌ Error fetching all trips:', error);
      throw error;
    }
  }

  // Get database statistics (for debugging)
  async getDatabaseStats(): Promise<any> {
    try {
      console.log('🔍 Fetching database statistics...');
      const stats = await this.request('/trips/stats');
      console.log('✅ Database stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching database stats:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', API_BASE_URL);
      // Use the health endpoint which tests database connection
      await this.request('/health');
      console.log('✅ API connection successful');
      return true;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  // Check if conductor exists and has trips
  async checkConductorStatus(username: string): Promise<{ exists: boolean; hasTrips: boolean; tripCount: number }> {
    try {
      console.log('🔍 Checking conductor status for:', username);
      
      // First check if user exists
      const userResponse = await fetch(`${API_BASE_URL}/user-auth/check/${username}`);
      const userExists = userResponse.ok;
      
      // Then check if they have trips
      const trips = await this.getConductorTrips(username);
      
      return {
        exists: userExists,
        hasTrips: trips.length > 0,
        tripCount: trips.length
      };
    } catch (error) {
      console.error('❌ Error checking conductor status:', error);
      return {
        exists: false,
        hasTrips: false,
        tripCount: 0
      };
    }
  }

  // Get server info for debugging
  getServerInfo() {
    return {
      baseUrl: API_BASE_URL,
      isHttps: API_BASE_URL.startsWith('https'),
      isLocal: API_BASE_URL.includes('192.168.0.150') || API_BASE_URL.includes('localhost'),
    };
  }

  // Get server health status
  async getServerHealth(): Promise<any> {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('Error getting server health:', error);
      throw error;
    }
  }
}

export const conductorAPI = new ConductorAPI(); 