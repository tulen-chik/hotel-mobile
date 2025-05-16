import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  cancelReservation,
  completeReservation,
  createReservation,
  subscribeToUserReservations,
} from '../services/rooms';
import { Reservation } from '../types';
import { useAuth } from './AuthContext';

interface ReservationContextType {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  fetchReservations: () => Promise<(() => void) | undefined>;
  addReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  complete: (id: string) => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = subscribeToUserReservations(user.uid, (reservations) => {
        console.log('Received reservations:', reservations);
        setReservations(reservations);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Ошибка загрузки резерваций');
      setLoading(false);
    }
  };

  const addReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      setLoading(true);
      console.log('Creating reservation with data:', data);
      const reservationId = await createReservation(data);
      console.log('Created reservation with ID:', reservationId);
      await fetchReservations();
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError('Ошибка создания резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      setLoading(true);
      await cancelReservation(id);
      await fetchReservations();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('Ошибка отмены резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const complete = async (id: string) => {
    try {
      setLoading(true);
      await completeReservation(id);
      await fetchReservations();
    } catch (err) {
      console.error('Error completing reservation:', err);
      setError('Ошибка завершения резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      if (user) {
        unsubscribe = await fetchReservations();
      } else {
        setReservations([]);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        loading,
        error,
        fetchReservations,
        addReservation,
        cancel,
        complete,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservations must be used within ReservationProvider');
  return ctx;
}; 