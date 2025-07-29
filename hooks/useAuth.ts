import { useState, useEffect } from 'react';
import { authStore } from '@/store/authStore';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing auth hook');

    // Load stored user on app start
    authStore
      .loadStoredUser()
      .then((storedUser) => {
        console.log('useAuth: Stored user loaded:', storedUser);
      })
      .catch((error) => {
        console.error('useAuth: Error loading stored user:', error);
      })
      .finally(() => {
        console.log('useAuth: Setting loading to false');
        setLoading(false);
      });

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

  console.log('useAuth: Current state - user:', user, 'loading:', loading);

  return {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
    getCurrentUserProfile,
    testConnection,
    isAuthenticated: authStore.isAuthenticated(),
  };
}
