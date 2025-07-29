import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const API_URL = 'http://192.168.0.150:3001/api/auth';

class AuthStore {
  private user: User | null = null;
  private token: string | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  async login(identifier: string, password: string): Promise<User> {
    // Backend expects username field, but can handle email or username
    const body = { username: identifier, password };

    console.log('Attempting login to:', `${API_URL}/login`);
    console.log('Login body:', body);

    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('Login response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Login error:', errorData);
      throw new Error(errorData.error || 'Invalid credentials');
    }

    const data = await res.json();
    console.log('Login response data:', data);

    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    // Map backend response to frontend User type
    const userData = data.data;
    this.user = {
      user_id: userData.id,
      username: userData.username,
      email: userData.mail,
      role: userData.role,
      created_at: userData.created_at,
    };

    this.token = userData.token;
    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('token', this.token || '');
    this.notifyListeners();
    return this.user!;
  }

  async register(userData: any): Promise<User> {
    // Map frontend data to backend expected format
    const registerData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      // Add optional profile fields
      ...(userData.firstname && { firstname: userData.firstname }),
      ...(userData.lastname && { lastname: userData.lastname }),
      ...(userData.dof && { date_of_birth: userData.dof }),

      // Role-specific fields - pass through all additional fields
      ...(userData.license_number && {
        license_number: userData.license_number,
      }),
      ...(userData.manager_username && {
        manager_username: userData.manager_username,
      }),
      ...(userData.organisation && { organisation: userData.organisation }),
      ...(userData.mobile_number && { mobile_number: userData.mobile_number }),
      ...(userData.address && { address: userData.address }),
      ...(userData.license_expire_date && {
        license_expire_date: userData.license_expire_date,
      }),
      ...(userData.blood_group && { blood_group: userData.blood_group }),
      ...(userData.emergency_contact_number && {
        emergency_contact_number: userData.emergency_contact_number,
      }),
      ...(userData.gender && { gender: userData.gender }),
      ...(userData.phone_number && { phone_number: userData.phone_number }),
      ...(userData.organization && { organization: userData.organization }),
    };

    console.log('Attempting registration to:', `${API_URL}/register`);
    console.log('Registration data:', registerData);

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    console.log('Registration response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Registration error:', errorData);
      throw new Error(
        errorData.error || errorData.errors?.[0]?.msg || 'Registration failed'
      );
    }

    const data = await res.json();
    console.log('Registration response data:', data);

    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    // Map backend response to frontend User type
    const responseData = data.data;
    this.user = {
      user_id: responseData.id,
      username: responseData.username,
      email: responseData.mail,
      role: responseData.role,
      created_at: responseData.created_at,
    };

    this.token = responseData.token;
    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('token', this.token || '');
    this.notifyListeners();
    return this.user!;
  }

  async logout(): Promise<void> {
    // Optionally notify backend, but for JWT just clear local storage
    this.user = null;
    this.token = null;
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    this.notifyListeners();
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_URL}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': this.token,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to change password');
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to change password');
    }
  }

  async getCurrentUserProfile(): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': this.token,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }

    const data = await res.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response from server');
    }

    // Map backend response to frontend User type and update stored user
    const userData = data.data;
    this.user = {
      user_id: userData.id,
      username: userData.username,
      email: userData.mail,
      role: userData.role,
      created_at: userData.created_at,
    };

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    this.notifyListeners();
    return this.user;
  }

  async loadStoredUser(): Promise<User | null> {
    try {
      console.log('AuthStore: Loading stored user from AsyncStorage');
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      console.log('AuthStore: Stored user:', storedUser);
      console.log('AuthStore: Stored token exists:', !!storedToken);

      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser);

        // Handle role mapping for old stored data
        if (this.user && this.user.role === 'conductor') {
          console.log('AuthStore: Mapping old role "conductor" to "driver"');
          this.user.role = 'driver';
          // Update the stored data with the new role
          await AsyncStorage.setItem('user', JSON.stringify(this.user));
        }

        this.token = storedToken;
        this.notifyListeners();
        console.log('AuthStore: Successfully loaded stored user:', this.user);
        return this.user;
      }

      console.log('AuthStore: No stored user found');
      return null;
    } catch (error) {
      console.error('AuthStore: Error loading stored user:', error);
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.user && !!this.token;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.user));
  }

  // Test connection to the auth API
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', `${API_URL}/test`);
      const res = await fetch(`${API_URL}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Test response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Test response data:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const authStore = new AuthStore();
