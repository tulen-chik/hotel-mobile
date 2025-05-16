import { CleaningRecord } from '@/types';
import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update
} from 'firebase/database';
import { Reservation } from '../types';
import { db } from './firebase/config';

export interface Room {
  id: string;
  number: string;
  beds: number;
  rooms: number;
  isOccupied: boolean;
  currentGuest?: {
    uid: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  lastCleaned: string;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'in_progress';
}

// Room Management
export const createRoom = async (roomData: Omit<Room, 'id'>): Promise<Room> => {
  try {
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;
    
    const room: Room = {
      id: roomId,
      ...roomData,
      lastCleaned: new Date().toISOString(),
      cleaningStatus: 'clean',
    };
    
    await set(newRoomRef, room);
    return room;
  } catch (error) {
    throw error;
  }
};

export const updateRoom = async (roomId: string, data: Partial<Room>): Promise<void> => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await update(roomRef, data);
  } catch (error) {
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await remove(roomRef);
  } catch (error) {
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return null;
    return snapshot.val() as Room;
  } catch (error) {
    throw error;
  }
};

// Real-time room listeners
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: Room | null) => void
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate(snapshot.val() as Room);
  });
};

export const subscribeToAllRooms = (
  onUpdate: (rooms: Room[]) => void
) => {
  console.log('Setting up all rooms subscription');
  const roomsRef = ref(db, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    console.log('Received rooms snapshot:', snapshot.exists());
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }
    const roomsData = snapshot.val();
    const rooms = Object.entries(roomsData).map(([id, data]: [string, any]) => ({
      id,
      ...data,
      lastCleaned: new Date(data.lastCleaned),
      currentGuest: data.currentGuest ? {
        ...data.currentGuest,
        checkIn: new Date(data.currentGuest.checkIn),
        checkOut: new Date(data.currentGuest.checkOut)
      } : undefined
    })) as Room[];
    console.log('Processed rooms:', rooms);
    onUpdate(rooms.sort((a, b) => (a.number || '').localeCompare(b.number || '')));
  }, (error) => {
    console.error('Error in rooms subscription:', error);
  });
};

export const subscribeToOccupiedRooms = (
  onUpdate: (rooms: Room[]) => void
) => {
  console.log('Setting up occupied rooms subscription');
  const roomsRef = ref(db, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    console.log('Received occupied rooms snapshot:', snapshot.exists());
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }
    const roomsData = snapshot.val();
    const rooms = Object.entries(roomsData)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data,
        lastCleaned: new Date(data.lastCleaned),
        currentGuest: data.currentGuest ? {
          ...data.currentGuest,
          checkIn: new Date(data.currentGuest.checkIn),
          checkOut: new Date(data.currentGuest.checkOut)
        } : undefined
      }))
      .filter(room => room.isOccupied) as Room[];
    console.log('Processed occupied rooms:', rooms.length);
    onUpdate(rooms.sort((a, b) => (a.number || '').localeCompare(b.number || '')));
  }, (error) => {
    console.error('Error in occupied rooms subscription:', error);
  });
};

// Cleaning Management
export const createCleaningRecord = async (
  roomId: string,
  cleanerId: string,
  notes?: string
): Promise<CleaningRecord> => {
  try {
    const cleaningRef = ref(db, 'cleaning_records');
    const newCleaningRef = push(cleaningRef);
    const cleaningId = newCleaningRef.key!;
    
    const cleaning: CleaningRecord = {
      id: cleaningId,
      roomId,
      cleanerId,
      cleanedAt: new Date(),
      status: 'in_progress',
      notes,
    };
    
    await set(newCleaningRef, cleaning);
    await updateRoom(roomId, { cleaningStatus: 'in_progress' });
    
    return cleaning;
  } catch (error) {
    throw error;
  }
};

export const completeCleaning = async (
  cleaningId: string,
  roomId: string
): Promise<void> => {
  try {
    const cleaningRef = ref(db, `cleaning_records/${cleaningId}`);
    await update(cleaningRef, {
      status: 'completed',
    });
    
    await updateRoom(roomId, {
      cleaningStatus: 'clean',
      lastCleaned: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// Reservation Management
export const createReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  try {
    // Проверяем существование комнаты
    const room = await getRoom(data.roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Проверяем, не занята ли комната
    const isOccupied = await isRoomOccupied(data.roomId, data.checkIn, data.checkOut);
    if (isOccupied) {
      throw new Error('Room is already occupied for these dates');
    }

    const reservationsRef = ref(db, 'reservations');
    const newReservationRef = push(reservationsRef);
    const reservationId = newReservationRef.key!;
    
    const now = new Date();
    const reservation = {
      id: reservationId,
      ...data,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      checkIn: (data.checkIn instanceof Date ? data.checkIn.toISOString() : data.checkIn),
      checkOut: (data.checkOut instanceof Date ? data.checkOut.toISOString() : data.checkOut),
    };
    
    // Создаем резервацию
    await set(newReservationRef, reservation);

    // Обновляем статус комнаты
    await updateRoom(data.roomId, {
      isOccupied: true,
      currentGuest: {
        uid: data.userId,
        name: '', // Имя гостя можно получить из данных пользователя
        checkIn: data.checkIn.toISOString(),
        checkOut: data.checkOut.toISOString()
      }
    });

    return reservationId;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (reservationId: string) => {
  try {
    const reservationRef = ref(db, `reservations/${reservationId}`);
    const snapshot = await get(reservationRef);
    
    if (!snapshot.exists()) {
      throw new Error('Reservation not found');
    }

    const reservation = snapshot.val();
    const now = new Date();

    // Обновляем статус резервации
    await update(reservationRef, {
      status: 'cancelled',
      updatedAt: now.toISOString()
    });

    // Обновляем статус комнаты
    await updateRoom(reservation.roomId, {
      isOccupied: false,
      currentGuest: undefined
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

export const completeReservation = async (reservationId: string) => {
  try {
    const reservationRef = ref(db, `reservations/${reservationId}`);
    const snapshot = await get(reservationRef);
    
    if (!snapshot.exists()) {
      throw new Error('Reservation not found');
    }

    const reservation = snapshot.val();
    const now = new Date();

    // Обновляем статус резервации
    await update(reservationRef, {
      status: 'completed',
      updatedAt: now.toISOString()
    });

    // Обновляем статус комнаты
    await updateRoom(reservation.roomId, {
      isOccupied: false,
      currentGuest: undefined,
      cleaningStatus: 'needs_cleaning'
    });
  } catch (error) {
    console.error('Error completing reservation:', error);
    throw error;
  }
};

export const getRoomCleaningHistory = async (roomId: string): Promise<CleaningRecord[]> => {
  try {
    const cleaningRef = ref(db, 'cleaning_records');
    const snapshot = await get(cleaningRef);
    if (!snapshot.exists()) return [];

    const recordsData = snapshot.val();
    const records = Object.entries(recordsData)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data,
        cleanedAt: new Date(data.cleanedAt)
      }))
      .filter(record => roomId === 'all' || record.roomId === roomId)
      .sort((a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime()) as CleaningRecord[];

    return records;
  } catch (error) {
    throw error;
  }
};

export const subscribeToUserReservations = (
  userId: string,
  onUpdate: (reservations: Reservation[]) => void
) => {
  console.log('Setting up reservations subscription for user:', userId);
  const reservationsRef = ref(db, 'reservations');
  
  const unsubscribe = onValue(reservationsRef, (snapshot) => {
    console.log('Received reservations snapshot:', snapshot.exists());
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    try {
      const reservationsData = snapshot.val();
      const reservations = Object.entries(reservationsData)
        .map(([id, data]: [string, any]) => {
          try {
            return {
              id,
              ...data,
              createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
              updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
              checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
              checkOut: data.checkOut ? new Date(data.checkOut) : undefined
            };
          } catch (error) {
            console.error('Error converting dates for reservation:', id, error);
            return null;
          }
        })
        .filter((reservation): reservation is Reservation => 
          reservation !== null && reservation.userId === userId
        )
        .sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.getTime() - a.createdAt.getTime() : 0));

      console.log('Processed reservations:', reservations.length);
      onUpdate(reservations);
    } catch (error) {
      console.error('Error processing reservations:', error);
      onUpdate([]);
    }
  }, (error) => {
    console.error('Error in reservations subscription:', error);
    onUpdate([]);
  });

  return unsubscribe;
};

export const isRoomOccupied = async (
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> => {
  console.log('Checking room occupancy:', { roomId, checkIn, checkOut });
  const reservationsRef = ref(db, 'reservations');
  const snapshot = await get(reservationsRef);
  if (!snapshot.exists()) {
    console.log('No reservations found');
    return false;
  }

  const reservations = snapshot.val();
  const isOccupied = Object.values(reservations).some((res: any) => {
    const resCheckIn = new Date(res.checkIn);
    const resCheckOut = new Date(res.checkOut);
    const hasOverlap = 
      res.roomId === roomId && 
      res.status === 'active' &&
      resCheckIn < checkOut && 
      resCheckOut > checkIn;
    
    if (hasOverlap) {
      console.log('Found overlapping reservation:', {
        existing: { checkIn: resCheckIn, checkOut: resCheckOut },
        requested: { checkIn, checkOut }
      });
    }
    return hasOverlap;
  });

  console.log('Room occupancy result:', isOccupied);
  return isOccupied;
}; 