import { createRepairRequest, deleteRepairRequest, getRepairRequests, getRepairRequestsByRoom, getRepairRequestsByUser, subscribeToRepairRequests, updateRepairRequest } from '@/services/repair-requests';
import { CreateRepairRequest, RepairRequest, UpdateRepairRequest } from '@/types/repair';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface RepairContextType {
  repairRequests: RepairRequest[];
  loading: boolean;
  error: string | null;
  createRequest: (request: CreateRepairRequest) => Promise<RepairRequest>;
  updateRequest: (id: string, request: UpdateRepairRequest) => Promise<RepairRequest>;
  deleteRequest: (id: string) => Promise<string>;
  fetchRequests: () => Promise<void>;
  fetchRequestsByUser: (userId: string) => Promise<void>;
  fetchRequestsByRoom: (roomId: string) => Promise<void>;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export function RepairProvider({ children }: { children: React.ReactNode }) {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToRepairRequests((requests) => {
      setRepairRequests(requests);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const createRequest = async (request: CreateRepairRequest) => {
    try {
      const newRequest = await createRepairRequest(request);
      return newRequest;
    } catch (error) {
      setError('Ошибка при создании заявки на ремонт');
      throw error;
    }
  };

  const updateRequest = async (id: string, request: UpdateRepairRequest) => {
    try {
      const updatedRequest = await updateRepairRequest(id, request);
      return updatedRequest;
    } catch (error) {
      setError('Ошибка при обновлении заявки на ремонт');
      throw error;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await deleteRepairRequest(id);
      return id;
    } catch (error) {
      setError('Ошибка при удалении заявки на ремонт');
      throw error;
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requests = await getRepairRequests();
      setRepairRequests(requests);
      setError(null);
    } catch (error) {
      setError('Ошибка при загрузке заявок на ремонт');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestsByUser = async (userId: string) => {
    try {
      setLoading(true);
      const requests = await getRepairRequestsByUser(userId);
      setRepairRequests(requests);
      setError(null);
    } catch (error) {
      setError('Ошибка при загрузке заявок пользователя');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestsByRoom = async (roomId: string) => {
    try {
      setLoading(true);
      const requests = await getRepairRequestsByRoom(roomId);
      setRepairRequests(requests);
      setError(null);
    } catch (error) {
      setError('Ошибка при загрузке заявок номера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RepairContext.Provider
      value={{
        repairRequests,
        loading,
        error,
        createRequest,
        updateRequest,
        deleteRequest,
        fetchRequests,
        fetchRequestsByUser,
        fetchRequestsByRoom,
      }}
    >
      {children}
    </RepairContext.Provider>
  );
}

export function useRepair() {
  const context = useContext(RepairContext);
  if (context === undefined) {
    throw new Error('useRepair must be used within a RepairProvider');
  }
  return context;
} 