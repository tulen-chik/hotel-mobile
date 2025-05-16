import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createCleaningRecord,
  getRoomCleaningHistory
} from '../services/rooms';
import { CleaningRecord } from '../types';
import { useAuth } from './AuthContext';

interface CleaningContextType {
  cleaningHistory: CleaningRecord[];
  loading: boolean;
  error: string | null;
  startCleaning: (roomId: string, notes?: string) => Promise<void>;
  finishCleaning: (cleaningId: string, roomId: string) => Promise<void>;
  getCleaningHistory: (roomId: string) => Promise<void>;
  cleaningRecords: CleaningRecord[];
  completeCleaning: (cleaningId: string, roomId: string) => Promise<void>;
}

const CleaningContext = createContext<CleaningContextType | undefined>(undefined);

export const CleaningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cleaningHistory, setCleaningHistory] = useState<CleaningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isCleaner } = useAuth();
  const [cleaningRecords, setCleaningRecords] = useState<CleaningRecord[]>([]);

  useEffect(() => {
    loadCleaningRecords();
  }, []);

  const loadCleaningRecords = async () => {
    try {
      setLoading(true);
      const records = await getRoomCleaningHistory('all');
      setCleaningRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cleaning records');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCleaning = async (roomId: string, notes?: string) => {
    if (!isCleaner || !user) throw new Error('Unauthorized');
    try {
      setLoading(true);
      setError(null);
      await createCleaningRecord(roomId, user.uid, notes);
      await handleGetCleaningHistory(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start cleaning');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFinishCleaning = async (cleaningId: string, roomId: string) => {
    if (!isCleaner || !user) throw new Error('Unauthorized');
    try {
      setLoading(true);
      setError(null);
      await completeCleaning(cleaningId, roomId);
      await handleGetCleaningHistory(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete cleaning');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetCleaningHistory = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);
      const history = await getRoomCleaningHistory(roomId);
      setCleaningHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cleaning history');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeCleaning = async (cleaningId: string, roomId: string) => {
    try {
      await completeCleaning(cleaningId, roomId);
      await loadCleaningRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete cleaning');
      throw err;
    }
  };

  const value = {
    cleaningHistory,
    loading,
    error,
    startCleaning: handleStartCleaning,
    finishCleaning: handleFinishCleaning,
    getCleaningHistory: handleGetCleaningHistory,
    cleaningRecords,
    completeCleaning,
  };

  return <CleaningContext.Provider value={value}>{children}</CleaningContext.Provider>;
};

export const useCleaning = () => {
  const context = useContext(CleaningContext);
  if (context === undefined) {
    throw new Error('useCleaning must be used within a CleaningProvider');
  }
  return context;
}; 