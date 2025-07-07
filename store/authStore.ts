import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const API_URL = 'https://safeway-backend-75xq.onrender.com/api/user-auth';

class AuthStore {
  private user: User | null = null;
  private token: string | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  async login(identifier: string, password: string): Promise<User> {
    // identifier can be email or username
    const body = identifier.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password };
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }
    const data = await res.json();
    if (!data.user) throw new Error('No user returned from API');
    this.user = data.user;
    this.token = typeof data.token === 'string' ? data.token : '';
    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('token', this.token || '');
    this.notifyListeners();
    return this.user!;
  }

  async register(userData: Omit<User, 'user_id' | 'created_at'> & { password: string }): Promise<User> {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const error = await res.json();
      console.log("failed")
      throw new Error(error.message || 'Registration failed');
    }
    const data = await res.json();
    if (!data.user) throw new Error('No user returned from API');
    this.user = data.user;
    this.token = typeof data.token === 'string' ? data.token : '';
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

  async loadStoredUser(): Promise<User | null> {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser);
        this.token = storedToken;
        this.notifyListeners();
        return this.user;
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
    return null;
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
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.user));
  }
}

export const authStore = new AuthStore();