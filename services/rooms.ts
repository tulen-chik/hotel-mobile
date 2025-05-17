import { CleaningRecord, Room } from '@/types';
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
import { notifyNewReservation } from './notifications';

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
  doorStatus: 'locked' | 'unlocked';
  lightStatus: 'on' | 'off';
  humidity: number;
  doorActions: {
    [key: string]: {
      action: 'unlock' | 'lock' | 'auto_lock';
      userId: string;
      userName: string;
      timestamp: string;
      type: 'manual' | 'auto';
    };
  };
  lastDoorAction?: {
    action: 'unlock' | 'lock' | 'auto_lock';
    userId: string;
    userName: string;
    timestamp: string;
    type: 'manual' | 'auto';
  };
  price: { perNight: number; currency: string };
  description: string;
  additionalInfo: {
    floor: number;
    area: number;
    maxGuests: number;
    amenities: string[];
    view: string;
    bedType: string;
    bathroomType: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
  };
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
      doorStatus: 'locked',
      lightStatus: 'off',
      humidity: 0,
      doorActions: {},
      price: roomData.price || { perNight: 0, currency: 'RUB' },
      description: roomData.description || '',
      additionalInfo: roomData.additionalInfo || {
        floor: 1,
        area: 0,
        maxGuests: 2,
        amenities: [],
        view: 'city',
        bedType: 'double',
        bathroomType: 'private',
        smokingAllowed: false,
        petsAllowed: false
      }
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
    if (roomId === 'string') return null;
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return {
      id: roomId,
      ...data,
      lastCleaned: new Date(data.lastCleaned),
      currentGuest: data.currentGuest ? {
        ...data.currentGuest,
        checkIn: new Date(data.currentGuest.checkIn),
        checkOut: new Date(data.currentGuest.checkOut)
      } : undefined
    } as Room;
  } catch (error) {
    throw error;
  }
};

// Real-time room listeners
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: Room | null) => void
) => {
  if (roomId === 'string') {
    onUpdate(null);
    return () => {};
  }
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }
    const data = snapshot.val();
    onUpdate({
      id: roomId,
      ...data,
      lastCleaned: new Date(data.lastCleaned),
      currentGuest: data.currentGuest ? {
        ...data.currentGuest,
        checkIn: new Date(data.currentGuest.checkIn),
        checkOut: new Date(data.currentGuest.checkOut)
      } : undefined
    } as Room);
  });
};

export const subscribeToAllRooms = (
  onUpdate: (rooms: Room[]) => void
) => {
  const roomsRef = ref(db, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }
    const roomsData = snapshot.val();
    const rooms = Object.entries(roomsData)
      .filter(([id]) => id !== 'string')
      .map(([id, data]: [string, any]) => ({
        id,
        ...data,
        lastCleaned: new Date(data.lastCleaned),
        currentGuest: data.currentGuest ? {
          ...data.currentGuest,
          checkIn: new Date(data.currentGuest.checkIn),
          checkOut: new Date(data.currentGuest.checkOut)
        } : undefined
      })) as Room[];
    onUpdate(rooms.sort((a, b) => (a.number || '').localeCompare(b.number || '')));
  });
};

export const subscribeToOccupiedRooms = (
  onUpdate: (rooms: Room[]) => void
) => {
  const roomsRef = ref(db, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }
    const roomsData = snapshot.val();
    const rooms = Object.entries(roomsData)
      .filter(([id]) => id !== 'string')
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
    onUpdate(rooms.sort((a, b) => (a.number || '').localeCompare(b.number || '')));
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
    // Получаем пользователя
    const userRef = ref(db, `users/${data.userId}`);
    const userSnap = await get(userRef);
    const user = userSnap.val();

    // Запрет для уборщиц
    if (user.role === 'cleaner') {
      throw new Error('Уборщица не может бронировать номера');
    }

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
      status: 'active' as const,
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

    // Отправляем уведомление администраторам
    await notifyNewReservation({
      ...reservation,
      status: 'active' as const,
      checkIn: new Date(reservation.checkIn),
      checkOut: new Date(reservation.checkOut),
      createdAt: new Date(reservation.createdAt),
      updatedAt: new Date(reservation.updatedAt)
    });

    return reservationId;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const cancelReservation = async (reservationId: string) => {
  console.log('Starting reservation cancellation for ID:', reservationId);
  try {
    const reservationRef = ref(db, `reservations/${reservationId}`);
    console.log('Fetching reservation data...');
    const snapshot = await get(reservationRef);
    
    if (!snapshot.exists()) {
      console.error('Reservation not found in database');
      throw new Error('Reservation not found');
    }

    const reservation = snapshot.val();
    console.log('Current reservation data:', {
      id: reservationId,
      status: reservation.status,
      roomId: reservation.roomId,
      userId: reservation.userId
    });

    const now = new Date();

    // Check if the reservation is already cancelled
    if (reservation.status === 'cancelled') {
      console.log('Reservation is already cancelled');
      throw new Error('Reservation is already cancelled');
    }

    // Check if the reservation is completed
    if (reservation.status === 'completed') {
      console.log('Cannot cancel completed reservation');
      throw new Error('Cannot cancel a completed reservation');
    }

    console.log('Updating reservation status to cancelled...');
    // Update reservation status
    await update(reservationRef, {
      status: 'cancelled',
      updatedAt: now.toISOString()
    });
    console.log('Reservation status updated successfully');

    console.log('Updating room status...');
    // Update room status
    await updateRoom(reservation.roomId, {
      isOccupied: false,
      currentGuest: undefined,
      cleaningStatus: 'needs_cleaning'
    });
    console.log('Room status updated successfully');

    console.log('Sending notification to admins...');
    // Send notification to admins
    await notifyNewReservation({
      ...reservation,
      status: 'cancelled',
      updatedAt: now
    });
    console.log('Notification sent successfully');

    console.log('Reservation cancellation completed successfully');
  } catch (error) {
    console.error('Error in cancelReservation:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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

// Управление дверью
export async function unlockDoor(roomId: string, userId: string): Promise<void> {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnapshot.val();
    
    // Проверяем, имеет ли пользователь доступ к комнате
    const hasAccess = await checkRoomAccess(roomId, userId);
    if (!hasAccess) {
      throw new Error('No access to this room');
    }

    // Получаем информацию о пользователе
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();

    const now = new Date().toISOString();
    const doorAction = {
      action: 'unlock',
      userId,
      userName: user.name,
      timestamp: now,
      type: 'manual'
    };

    // Обновляем статус двери и логируем действие
    await update(roomRef, {
      doorStatus: 'unlocked',
      lastDoorAction: doorAction,
      doorActions: {
        ...room.doorActions,
        [now]: doorAction
      }
    });

    // Через 30 секунд автоматически блокируем дверь
    setTimeout(async () => {
      const autoLockAction = {
        action: 'auto_lock',
        userId: 'system',
        userName: 'System',
        timestamp: new Date().toISOString(),
        type: 'auto'
      };

      await update(roomRef, {
        doorStatus: 'locked',
        lastDoorAction: autoLockAction,
        doorActions: {
          ...room.doorActions,
          [autoLockAction.timestamp]: autoLockAction
        }
      });
    }, 30000);
  } catch (error) {
    console.error('Error unlocking door:', error);
    throw error;
  }
}

// Управление светом
export async function toggleLight(roomId: string, userId: string): Promise<void> {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnapshot.val();
    const newLightStatus = room.lightStatus === 'on' ? 'off' : 'on';

    await update(roomRef, {
      lightStatus: newLightStatus
    });
  } catch (error) {
    console.error('Error toggling light:', error);
    throw error;
  }
}

// Обновление влажности
export async function updateHumidity(roomId: string, humidity: number): Promise<void> {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    if (humidity < 0 || humidity > 100) {
      throw new Error('Invalid humidity value');
    }

    await update(roomRef, {
      humidity
    });
  } catch (error) {
    console.error('Error updating humidity:', error);
    throw error;
  }
}

// Получить историю действий с дверью
export async function getDoorActionHistory(roomId: string): Promise<Room['doorActions']> {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnapshot.val();
    return room.doorActions || {};
  } catch (error) {
    console.error('Error getting door action history:', error);
    throw error;
  }
}

// Проверка доступа к комнате
export async function checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
  try {
    // Получаем информацию о пользователе
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      return false;
    }

    const user = userSnapshot.val();
    
    // Администраторы имеют доступ ко всем комнатам
    if (user.role === 'admin') {
      return true;
    }

    // Уборщики имеют доступ к комнатам, где есть активные запросы на уборку
    if (user.role === 'cleaner') {
      const requestsRef = ref(db, 'cleaning_requests');
      const requestsSnapshot = await get(requestsRef);
      
      if (!requestsSnapshot.exists()) {
        return false;
      }

      const requests = requestsSnapshot.val();
      return Object.values(requests).some((req: any) => 
        req.roomId === roomId && 
        req.assignedTo === userId && 
        ['pending', 'approved'].includes(req.status)
      );
    }

    // Обычные пользователи имеют доступ только к своим забронированным комнатам
    const reservationsRef = ref(db, 'reservations');
    const reservationsSnapshot = await get(reservationsRef);
    
    if (!reservationsSnapshot.exists()) {
      return false;
    }

    const reservations = reservationsSnapshot.val();
    return Object.values(reservations).some((res: any) => 
      res.roomId === roomId && 
      res.userId === userId && 
      res.status === 'active'
    );
  } catch (error) {
    console.error('Error checking room access:', error);
    return false;
  }
}

// Получить статус двери
export async function getDoorStatus(roomId: string): Promise<'locked' | 'unlocked'> {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnapshot.val();
    return room.doorStatus || 'locked';
  } catch (error) {
    console.error('Error getting door status:', error);
    throw error;
  }
}

// Подписаться на изменения статуса двери
export const subscribeToDoorStatus = (
  roomId: string,
  onUpdate: (status: 'locked' | 'unlocked') => void
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate('locked');
      return;
    }
    
    const room = snapshot.val();
    onUpdate(room.doorStatus || 'locked');
  });
};
