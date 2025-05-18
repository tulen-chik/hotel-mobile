import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createUserByAdmin, getCurrentUser, loginUser, logoutUser, registerUser, updateUserProfile } from '../services/auth';
import { User, UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, phone?: string, role?: 'user' | 'cleaner' | 'repairer') => Promise<User>;
  createUser: (email: string, password: string, name: string, role: 'user' | 'cleaner' | 'admin', phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  initialized: boolean;
  onAuthStateChanged: (callback: (user: User | null) => void) => void;
  isAdmin: boolean;
  isCleaner: boolean;
  isRepairer: boolean;
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
    setLoading(true);
    setError(null);
    
    try {
      const userData = await loginUser(email, password);
      setUser(userData);
      authCallbacks.forEach(callback => callback(userData));
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при входе';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = (
    email: string, 
    password: string, 
    name: string, 
    phone?: string,
    role: 'user' | 'cleaner' | 'repairer' = 'user'
  ) => {
    setLoading(true);
    setError(null);
    
    return registerUser(email, password, name, role, phone)
      .then((userData) => {
        setUser(userData);
        authCallbacks.forEach(callback => callback(userData));
        return userData;
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при регистрации';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const logout = () => {
    setLoading(true);
    setError(null);
    
    return logoutUser()
      .then(() => {
        setUser(null);
        authCallbacks.forEach(callback => callback(null));
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при выходе';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateSettings = (settings: UserSettings) => {
    if (!user) return Promise.reject(new Error('Пользователь не авторизован'));
    
    setLoading(true);
    setError(null);
    
    const updatedUser = { ...user, settings };
    
    return Promise.resolve()
      .then(() => AsyncStorage.setItem('@user', JSON.stringify(updatedUser)))
      .then(() => {
        setUser(updatedUser);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении настроек';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return Promise.reject(new Error('Пользователь не авторизован'));
    
    setLoading(true);
    setError(null);
    
    return updateUserProfile(user.uid, data)
      .then(() => {
        const updatedUser = { ...user, ...data };
        return AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      })
      .then(() => {
        setUser({ ...user, ...data });
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении пользователя';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const createUser = (
    email: string,
    password: string,
    name: string,
    role: 'user' | 'cleaner' | 'admin',
    phone?: string
  ) => {
    if (!user || user.role !== 'admin') {
      const errorMessage = 'Только администраторы могут создавать пользователей';
      setError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    setLoading(true);
    setError(null);
    
    return createUserByAdmin(email, password, name, role, phone)
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании пользователя';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
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
    isRepairer: user?.role === 'repairer',
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