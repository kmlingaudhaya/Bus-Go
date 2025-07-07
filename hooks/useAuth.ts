import { useState, useEffect } from 'react';
import { authStore } from '@/store/authStore';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stored user on app start
    authStore.loadStoredUser().finally(() => setLoading(false));

    // Subscribe to auth changes
    const unsubscribe = authStore.subscribe(setUser);
    return unsubscribe;
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    return authStore.login(emailOrUsername, password);
  };

  const register = async (userData: Omit<User, 'user_id' | 'created_at'> & { password: string }) => {
    return authStore.register(userData);
  };

  const logout = async () => {
    return authStore.logout();
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: authStore.isAuthenticated(),
  };
}