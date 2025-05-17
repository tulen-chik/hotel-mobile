import {
  assignCleaner as assignCleanerService,
  createCleaningRequest,
  hasActiveReservation,
  subscribeToCleaningRequests,
  updateCleaningRequestStatus
} from '@/services/cleaning-requests';
import { CleaningRequest } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface CleaningRequestContextType {
  requests: CleaningRequest[];
  loading: boolean;
  error: string | null;
  createRequest: (
    roomId: string,
    reservationId: string,
    requestType: 'regular' | 'urgent',
    notes?: string
  ) => Promise<void>;
  updateRequestStatus: (
    requestId: string,
    status: CleaningRequest['status']
  ) => Promise<void>;
  assignCleaner: (requestId: string, cleanerId: string) => Promise<void>;
  checkActiveReservation: (roomId: string) => Promise<boolean>;
}

const CleaningRequestContext = createContext<CleaningRequestContextType | undefined>(undefined);

export const CleaningRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const filters = user.role === 'admin' 
        ? undefined 
        : user.role === 'cleaner'
          ? { assignedTo: user.id }
          : { userId: user.id };
      return subscribeToCleaningRequests(filters, (data) => {
        setRequests(data);
        setLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setLoading(false);
    }
  };

  const createRequest = async (
    roomId: string,
    reservationId: string,
    requestType: 'regular' | 'urgent',
    notes?: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const hasReservation = await hasActiveReservation(roomId, user.id);
      if (!hasReservation) {
        throw new Error('No active reservation for this room');
      }

      await createCleaningRequest(roomId, user.id, reservationId, requestType, notes);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
      throw err;
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: CleaningRequest['status']
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateCleaningRequestStatus(
        requestId,
        status,
        status === 'completed' ? user.id : undefined
      );
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
      throw err;
    }
  };

  const assignCleaner = async (requestId: string, cleanerId: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only administrators can assign cleaners');
    }
    
    try {
      await assignCleanerService(requestId, cleanerId);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign cleaner');
      throw err;
    }
  };

  const checkActiveReservation = async (roomId: string): Promise<boolean> => {
    try {
      return await hasActiveReservation(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check reservation');
      return false;
    }
  };

  const value = {
    requests,
    loading,
    error,
    createRequest,
    updateRequestStatus,
    assignCleaner,
    checkActiveReservation
  };

  return (
    <CleaningRequestContext.Provider value={value}>
      {children}
    </CleaningRequestContext.Provider>
  );
};

export const useCleaningRequest = () => {
  const context = useContext(CleaningRequestContext);
  if (context === undefined) {
    throw new Error('useCleaningRequest must be used within a CleaningRequestProvider');
  }
  return context;
}; 