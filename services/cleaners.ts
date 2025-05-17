import { db } from '@/services/firebase/init';
import { User } from '@/types';
import { get, onValue, ref } from 'firebase/database';

export const subscribeToAvailableCleaners = (
  onUpdate: (cleaners: User[]) => void
) => {
  const usersRef = ref(db, 'users');
  return onValue(usersRef, async (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const usersData = snapshot.val();
    const cleaners = Object.entries(usersData)
      .filter(([_, data]: [string, any]) => data.role === 'cleaner')
      .map(([id, data]: [string, any]) => ({
        id,
        ...data
      })) as User[];

    // Получаем все активные уборки
    const activeCleaningsRef = ref(db, 'cleaning_requests');
    const activeCleaningsSnapshot = await get(activeCleaningsRef);
    const activeCleanings = activeCleaningsSnapshot.val() || {};
    
    const busyCleanerIds = new Set(
      Object.values(activeCleanings)
        .filter((req: any) => ['pending', 'approved'].includes(req.status))
        .map((req: any) => req.assignedTo)
        .filter(Boolean)
    );

    // Фильтруем уборщиков, которые не заняты
    const availableCleaners = cleaners.filter(cleaner => !busyCleanerIds.has(cleaner.id));
    onUpdate(availableCleaners);
  });
};

export const subscribeToCleaner = (
  cleanerId: string,
  onUpdate: (cleaner: User | null) => void
) => {
  const cleanerRef = ref(db, `users/${cleanerId}`);
  return onValue(cleanerRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    const data = snapshot.val();
    if (data.role !== 'cleaner') {
      onUpdate(null);
      return;
    }

    onUpdate({
      id: cleanerId,
      ...data
    } as User);
  });
};

export const getCleanerById = async (cleanerId: string): Promise<User | null> => {
  try {
    const cleanerRef = ref(db, `users/${cleanerId}`);
    const snapshot = await get(cleanerRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();
    return {
      id: cleanerId,
      ...data
    } as User;
  } catch (error) {
    console.error('Error getting cleaner by id:', error);
    throw error;
  }
}; 