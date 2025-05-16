import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createUserByAdmin, getCurrentUser, loginUser, logoutUser, registerUser, updateUserProfile } from '../services/auth';
import { User, UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  createUser: (email: string, password: string, name: string, role: 'user' | 'cleaner' | 'admin', phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  initialized: boolean;
  onAuthStateChanged: (callback: (user: User | null) => void) => void;
  isAdmin: boolean;
  isCleaner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authCallbacks, setAuthCallbacks] = useState<((user: User | null) => void)[]>([]);

  const onAuthStateChanged = (callback: (user: User | null) => void) => {
    setAuthCallbacks(prev => [...prev, callback]);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson) {
          const localUser = JSON.parse(userJson);
          setUser(localUser);
          setInitialized(true);
          setLoading(false);
          authCallbacks.forEach(callback => callback(localUser));
          return;
        }
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setInitialized(true);
        authCallbacks.forEach(callback => callback(currentUser));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUser(null);
        setInitialized(true);
        authCallbacks.forEach(callback => callback(null));
      } finally {
        setLoading(false);
      }
    };
  
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await loginUser(email, password);
      setUser(userData);
      authCallbacks.forEach(callback => callback(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await registerUser(email, password, name, 'user', phone);
      setUser(userData);
      authCallbacks.forEach(callback => callback(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      authCallbacks.forEach(callback => callback(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settings: UserSettings) => {
    if (!user) return;
    try {
      setLoading(true);
      const updatedUser = { ...user, settings };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      setLoading(true);
      await updateUserProfile(user.uid, data);
      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (
    email: string,
    password: string,
    name: string,
    role: 'user' | 'cleaner' | 'admin',
    phone?: string
  ): Promise<User> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only administrators can create users');
    }
    try {
      setLoading(true);
      setError(null);
      const newUser = await createUserByAdmin(email, password, name, role, phone);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    createUser,
    logout,
    updateSettings,
    updateUser,
    initialized,
    onAuthStateChanged,
    isAdmin: user?.role === 'admin',
    isCleaner: user?.role === 'cleaner',
  };

  if (!initialized || loading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};