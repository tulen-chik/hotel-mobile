import React, { createContext, useContext, useEffect, useState } from 'react';
import { RoomServiceOrder, createRoomServiceOrder, deleteRoomServiceOrder, subscribeToRoomServiceOrders, subscribeToRoomServiceOrdersByRoom, subscribeToUserRoomServiceOrders, updateRoomServiceOrder } from '../services/room-service';
import { useAuth } from './AuthContext';

interface RoomServiceContextType {
  orders: RoomServiceOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrdersByUser: (userId: string) => Promise<void>;
  fetchOrdersByRoom: (roomId: string) => Promise<void>;
  createOrder: (order: Omit<RoomServiceOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<RoomServiceOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const RoomServiceContext = createContext<RoomServiceContextType | undefined>(undefined);

export const RoomServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<RoomServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [subscriptionType, setSubscriptionType] = useState<'all' | 'user' | 'room'>('all');
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      if (subscriptionType === 'all') {
        unsubscribe = subscribeToRoomServiceOrders((items) => {
          setOrders(items);
          setLoading(false);
        });
      } else if (subscriptionType === 'user' && subscriptionId) {
        unsubscribe = subscribeToUserRoomServiceOrders(subscriptionId, (items) => {
          setOrders(items);
          setLoading(false);
        });
      } else if (subscriptionType === 'room' && subscriptionId) {
        unsubscribe = subscribeToRoomServiceOrdersByRoom(subscriptionId, (items) => {
          setOrders(items);
          setLoading(false);
        });
      }
    };

    setLoading(true);
    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [subscriptionType, subscriptionId]);

  const fetchOrders = async () => {
    setSubscriptionType('all');
    setSubscriptionId(null);
  };

  const fetchOrdersByUser = async (userId: string) => {
    setSubscriptionType('user');
    setSubscriptionId(userId);
  };

  const fetchOrdersByRoom = async (roomId: string) => {
    setSubscriptionType('room');
    setSubscriptionId(roomId);
  };

  const createOrder = async (order: Omit<RoomServiceOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      await createRoomServiceOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (id: string, order: Partial<RoomServiceOrder>) => {
    try {
      setLoading(true);
      setError(null);
      await updateRoomServiceOrder(id, order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteRoomServiceOrder(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoomServiceContext.Provider
      value={{
        orders,
        loading,
        error,
        fetchOrders,
        fetchOrdersByUser,
        fetchOrdersByRoom,
        createOrder,
        updateOrder,
        deleteOrder,
      }}
    >
      {children}
    </RoomServiceContext.Provider>
  );
};

export const useRoomService = () => {
  const context = useContext(RoomServiceContext);
  if (context === undefined) {
    throw new Error('useRoomService must be used within a RoomServiceProvider');
  }
  return context;
}; 