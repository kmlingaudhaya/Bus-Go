import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from '@/store/authStore';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing auth hook');

    // Check if there's a stored user immediately
    const checkStoredUser = async () => {
      try {
        const storedUser = await authStore.loadStoredUser();
        console.log('useAuth: Stored user loaded:', storedUser);

        // If no stored user, immediately set loading to false to trigger redirect
        if (!storedUser) {
          console.log('useAuth: No stored user found, will redirect to login');
          setUser(null);
          setLoading(false);
          return;
        }

        // If stored user exists, update the state
        setUser(storedUser);
        setLoading(false);
      } catch (error) {
        console.error('useAuth: Error loading stored user:', error);
        // On error, assume no user and redirect to login
        setUser(null);
        setLoading(false);
      }
    };

    checkStoredUser();

    // Subscribe to auth changes
    const unsubscribe = authStore.subscribe((newUser) => {
      console.log('useAuth: User state changed:', newUser);
      setUser(newUser);
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    console.log('useAuth: Attempting login for:', emailOrUsername);
    return authStore.login(emailOrUsername, password);
  };

  const register = async (
    userData: Omit<User, 'user_id' | 'created_at'> & { password: string }
  ) => {
    console.log('useAuth: Attempting registration for:', userData.username);
    return authStore.register(userData);
  };

  const logout = async () => {
    console.log('useAuth: Logging out');
    return authStore.logout();
  };

  const clearStoredData = async () => {
    console.log('useAuth: Clearing stored data');
    return authStore.clearStoredData();
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    return authStore.changePassword(currentPassword, newPassword);
  };

  const getCurrentUserProfile = async () => {
    return authStore.getCurrentUserProfile();
  };

  const testConnection = async () => {
    return authStore.testConnection();
  };

  const checkStoredData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      return !!(storedUser && storedToken);
    } catch (error) {
      console.error('Error checking stored data:', error);
      return false;
    }
  };

  console.log('useAuth: Current state - user:', user, 'loading:', loading);

  return {
    user,
    loading,
    login,
    register,
    logout,
    clearStoredData,
    changePassword,
    getCurrentUserProfile,
    testConnection,
    checkStoredData,
    isAuthenticated: authStore.isAuthenticated(),
  };
}
