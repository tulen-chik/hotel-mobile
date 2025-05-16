import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  addNotification,
  deleteNotification,
  markNotificationAsRead,
  subscribeToUserNotifications,
} from '../services/notifications';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  createNotification: (data: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      subscribeToUserNotifications(user.uid, (notifs) => {
        setNotifications(notifs);
        setLoading(false);
      });
    } catch (err) {
      setError('Ошибка загрузки уведомлений');
      setLoading(false);
    }
  };

  const createNotification = async (data: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      await addNotification(data);
      await fetchNotifications();
    } catch (err) {
      setError('Ошибка создания уведомления');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setLoading(true);
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err) {
      setError('Ошибка обновления уведомления');
    } finally {
      setLoading(false);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      setLoading(true);
      await deleteNotification(id);
      await fetchNotifications();
    } catch (err) {
      setError('Ошибка удаления уведомления');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        error,
        fetchNotifications,
        createNotification,
        markAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}; 