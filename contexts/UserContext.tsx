import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { subscribeToUsers, createUser, updateUser, deleteUser } from '@/services/users';
import { useAuth } from './AuthContext';

interface CreateUserData extends Omit<User, 'id' | 'uid'> {
  password: string;
}

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  addUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAdmin]);

  const handleCreateUser = async (userData: CreateUserData) => {
    if (!isAdmin) throw new Error('Unauthorized');
    try {
      setError(null);
      await createUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    if (!isAdmin) throw new Error('Unauthorized');
    try {
      setError(null);
      await updateUser(userId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) throw new Error('Unauthorized');
    try {
      setError(null);
      await deleteUser(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      throw err;
    }
  };

  const value = {
    users,
    loading,
    error,
    addUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}; 