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
    if (!user) {
      console.log('No user found, skipping reservation fetch');
      return;
    }
    console.log('Fetching reservations for user:', user.id);
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = subscribeToUserReservations(user.uid, (reservations) => {
        console.log('Received reservations update:', {
          count: reservations.length,
          reservations: reservations.map(r => ({
            id: r.id,
            status: r.status,
            roomId: r.roomId
          }))
        });
        setReservations(reservations);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error('Error fetching reservations:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Ошибка загрузки резерваций');
      setLoading(false);
    }
  };

  const addReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    console.log('Adding new reservation:', data);
    try {
      setLoading(true);
      const reservationId = await createReservation(data);
      console.log('Created reservation with ID:', reservationId);
      await fetchReservations();
    } catch (err) {
      console.error('Error creating reservation:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        data
      });
      setError('Ошибка создания резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    console.log('Cancelling reservation:', id);
    try {
      setLoading(true);
      await cancelReservation(id);
      console.log('Reservation cancelled successfully');
      await fetchReservations();
    } catch (err) {
      console.error('Error cancelling reservation:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        reservationId: id
      });
      setError('Ошибка отмены резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const complete = async (id: string) => {
    console.log('Completing reservation:', id);
    try {
      setLoading(true);
      await completeReservation(id);
      console.log('Reservation completed successfully');
      await fetchReservations();
    } catch (err) {
      console.error('Error completing reservation:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        reservationId: id
      });
      setError('Ошибка завершения резервации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('ReservationProvider mounted/updated, user:', user?.id);
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      if (user) {
        console.log('Setting up reservations subscription for user:', user.id);
        unsubscribe = await fetchReservations();
      } else {
        console.log('No user, clearing reservations');
        setReservations([]);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up reservations subscription');
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