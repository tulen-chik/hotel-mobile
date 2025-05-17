import { CleaningRequest } from '@/types';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { db } from './firebase/config';
import { sendNotification } from './notifications';

// Получить свободных уборщиков
async function getAvailableCleaners(): Promise<string[]> {
  const cleanersRef = ref(db, 'users');
  const cleanersSnapshot = await get(cleanersRef);
  const cleaners = Object.entries(cleanersSnapshot.val() || {})
    .filter(([_, data]: [string, any]) => data.role === 'cleaner')
    .map(([id]) => id);

  // Получаем уборщиков, у которых есть активные задания
  const requestsRef = ref(db, 'cleaning_requests');
  const requestsSnapshot = await get(requestsRef);
  const requests = requestsSnapshot.val() || {};
  
  const busyCleaners = new Set(
    Object.values(requests)
      .filter((req: any) => ['pending', 'approved'].includes(req.status))
      .map((req: any) => req.assignedTo)
      .filter(Boolean)
  );

  return cleaners.filter(id => !busyCleaners.has(id));
}

// Создать запрос на уборку
export async function createCleaningRequest(
  roomId: string,
  userId: string,
  reservationId: string,
  requestType: 'regular' | 'urgent',
  notes?: string
): Promise<string> {
  console.log('Starting cleaning request creation:', {
    roomId,
    userId,
    reservationId,
    requestType,
    notes
  });

  try {
    // Check if the user has an active reservation for this room
    console.log('Checking for active reservation...');
    const hasReservation = await hasActiveReservation(roomId, userId);
    console.log('Active reservation check result:', hasReservation);

    if (!hasReservation) {
      console.error('No active reservation found for room:', roomId);
      throw new Error('No active reservation found for this room');
    }

    console.log('Creating new cleaning request...');
    const requestsRef = ref(db, 'cleaning_requests');
    const newRequestRef = push(requestsRef);
    const requestId = newRequestRef.key!;
    const now = new Date();
    
    console.log('Finding available cleaners...');
    // Пытаемся найти свободного уборщика
    const availableCleaners = await getAvailableCleaners();
    console.log('Available cleaners:', availableCleaners);
    const assignedTo = availableCleaners.length > 0 ? availableCleaners[0] : null;
    console.log('Assigned cleaner:', assignedTo);
    
    const request: CleaningRequest = {
      id: requestId,
      roomId,
      userId,
      reservationId,
      status: 'pending',
      requestType,
      notes,
      assignedTo,
      assignedAt: assignedTo ? now : null,
      createdAt: now,
      updatedAt: now
    };

    console.log('Saving cleaning request to database:', request);
    await set(newRequestRef, request);
    console.log('Cleaning request saved successfully');

    // Отправляем уведомление уборщику, если он был назначен
    if (assignedTo) {
      console.log('Sending notification to assigned cleaner:', assignedTo);
      await sendNotification([assignedTo], {
        title: 'Новое задание на уборку',
        body: `Вам назначена уборка комнаты ${roomId}`,
        type: 'cleaning',
        data: {
          requestId,
          roomId,
          requestType
        }
      });
      console.log('Notification sent successfully');
    }

    console.log('Cleaning request creation completed successfully');
    return requestId;
  } catch (error) {
    console.error('Error in createCleaningRequest:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: { roomId, userId, reservationId, requestType, notes }
    });
    throw error;
  }
}

// Назначить уборщика на запрос
export async function assignCleaner(
  requestId: string,
  cleanerId: string
): Promise<void> {
  const requestRef = ref(db, `cleaning_requests/${requestId}`);
  const now = new Date();

  await update(requestRef, {
    assignedTo: cleanerId,
    assignedAt: now,
    updatedAt: now
  });

  // Отправляем уведомление уборщику
  await sendNotification([cleanerId], {
    title: 'Новое задание на уборку',
    body: 'Вам назначена новая уборка',
    type: 'cleaning',
    data: {
      requestId,
      roomId: (await get(requestRef)).val()?.roomId
    }
  });
}

// Real-time cleaning request listeners
export const subscribeToCleaningRequests = (
  filters: {
    status?: CleaningRequest['status'];
    roomId?: string;
    userId?: string;
    assignedTo?: string;
  } | undefined,
  onUpdate: (requests: CleaningRequest[]) => void
) => {
  const requestsRef = ref(db, 'cleaning_requests');
  return onValue(requestsRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const requestsData = snapshot.val();
    let requests = Object.entries(requestsData)
      .map(([id, data]: [string, any]) => ({
        id,
        ...data
      })) as CleaningRequest[];

    if (filters) {
      if (filters.status) {
        requests = requests.filter(req => req.status === filters.status);
      }
      if (filters.roomId) {
        requests = requests.filter(req => req.roomId === filters.roomId);
      }
      if (filters.userId) {
        requests = requests.filter(req => req.userId === filters.userId);
      }
      if (filters.assignedTo) {
        requests = requests.filter(req => req.assignedTo === filters.assignedTo);
      }
    }

    onUpdate(requests);
  });
};

export const subscribeToCleaningRequest = (
  requestId: string,
  onUpdate: (request: CleaningRequest | null) => void
) => {
  const requestRef = ref(db, `cleaning_requests/${requestId}`);
  return onValue(requestRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }
    
    onUpdate({
      id: requestId,
      ...snapshot.val()
    } as CleaningRequest);
  });
};

// Обновить статус запроса
export async function updateCleaningRequestStatus(
  requestId: string,
  status: CleaningRequest['status'],
  completedBy?: string
): Promise<void> {
  const requestRef = ref(db, `cleaning_requests/${requestId}`);
  const updateData: Partial<CleaningRequest> = {
    status,
    updatedAt: new Date()
  };

  if (status === 'completed' && completedBy) {
    updateData.completedAt = new Date();
    updateData.completedBy = completedBy;
  }

  await update(requestRef, updateData);
}

// Проверить, есть ли активная резервация для комнаты
export async function hasActiveReservation(roomId: string, userId?: string): Promise<boolean> {
  console.log('Checking active reservation:', { roomId, userId });
  try {
    const reservationsRef = ref(db, 'reservations');
    const snapshot = await get(reservationsRef);
    
    if (!snapshot.exists()) {
      console.log('No reservations found in database');
      return false;
    }

    const reservations = snapshot.val();
    console.log('Found reservations:', Object.keys(reservations).length);

    const hasReservation = Object.values(reservations).some((res: any) => {
      const matches = 
        res.roomId === roomId && 
        res.status === 'active' &&
        (!userId || res.userId === userId);
      
      if (matches) {
        console.log('Found matching reservation:', {
          id: res.id,
          roomId: res.roomId,
          userId: res.userId,
          status: res.status
        });
      }
      
      return matches;
    });

    console.log('Active reservation check result:', hasReservation);
    return hasReservation;
  } catch (error) {
    console.error('Error in hasActiveReservation:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: { roomId, userId }
    });
    throw error;
  }
} 