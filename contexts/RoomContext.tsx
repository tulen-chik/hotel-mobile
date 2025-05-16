import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createRoom,
  getRoom,
  subscribeToAllRooms,
  subscribeToOccupiedRooms
} from '../services/rooms';
import { Room } from '../types';

interface RoomContextType {
  rooms: Room[];
  occupiedRooms: Room[];
  loading: boolean;
  error: string | null;
  // addRoom: (roomData: Omit<Room, 'id'>) => Promise<void>;
  // updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  // deleteRoom: (roomId: string) => Promise<void>;
  getRoom: (roomId: string) => Promise<Room | null>;
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupiedRooms, setOccupiedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { isAdmin } = useAuth();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching rooms...');
      subscribeToAllRooms((allRooms) => {
        setRooms(allRooms);
        setLoading(false);
      });
      subscribeToOccupiedRooms((occupied) => {
        setOccupiedRooms(occupied);
      });
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('RoomProvider mounted');
    fetchRooms();
  }, []);

  // const handleCreateRoom = async (roomData: Omit<Room, 'id'>) => {
  //   if (!isAdmin) throw new Error('Unauthorized');
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     await createRoom(roomData);
  //     await fetchRooms();
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to create room');
  //     throw err;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
  //   if (!isAdmin) throw new Error('Unauthorized');
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     await updateRoom(roomId, data);
  //     await fetchRooms();
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to update room');
  //     throw err;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDeleteRoom = async (roomId: string) => {
  //   if (!isAdmin) throw new Error('Unauthorized');
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     await deleteRoom(roomId);
  //     await fetchRooms();
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to delete room');
  //     throw err;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleGetRoom = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await getRoom(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      await createRoom(roomData);
      await fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    rooms,
    occupiedRooms,
    loading,
    error,
    addRoom,
    // updateRoom: handleUpdateRoom,
    // deleteRoom: handleDeleteRoom,
    getRoom: handleGetRoom,
    refreshRooms: fetchRooms,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
}; 