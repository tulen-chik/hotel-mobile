import { CreateRepairRequest, RepairRequest } from '@/types/repair';
import { equalTo, get, onValue, orderByChild, query, ref, remove, set } from 'firebase/database';
import { db } from './firebase/config';

export const createRepairRequest = async (request: CreateRepairRequest): Promise<RepairRequest> => {
  try {
    const requestsRef = ref(db, 'repairRequests');
    const newRequestRef = ref(db, 'repairRequests/' + Date.now());
    const timestamp = Date.now();
    const newRequest = {
      ...request,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await set(newRequestRef, newRequest);
    const id = newRequestRef.key || Date.now().toString();
    return { id, ...newRequest };
  } catch (error) {
    console.error('Error creating repair request:', error);
    throw error;
  }
};

export const updateRepairRequest = async (id: string, request: Partial<RepairRequest>): Promise<RepairRequest> => {
  try {
    const requestRef = ref(db, `repairRequests/${id}`);
    const snapshot = await get(requestRef);
    const existingData = snapshot.val() as Omit<RepairRequest, 'id'>;
    const updateData = {
      ...existingData,
      ...request,
      updatedAt: Date.now()
    };
    await set(requestRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating repair request:', error);
    throw error;
  }
};

export const deleteRepairRequest = async (id: string): Promise<string> => {
  try {
    const requestRef = ref(db, `repairRequests/${id}`);
    await remove(requestRef);
    return id;
  } catch (error) {
    console.error('Error deleting repair request:', error);
    throw error;
  }
};

export const getRepairRequests = async (): Promise<RepairRequest[]> => {
  try {
    const requestsRef = ref(db, 'repairRequests');
    const snapshot = await get(requestsRef);
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    return Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
  } catch (error) {
    console.error('Error getting repair requests:', error);
    throw error;
  }
};

export const getRepairRequestsByUser = async (userId: string): Promise<RepairRequest[]> => {
  try {
    const requestsRef = ref(db, 'repairRequests');
    const userQuery = query(requestsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    return Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
  } catch (error) {
    console.error('Error getting user repair requests:', error);
    throw error;
  }
};

export const getRepairRequestsByRoom = async (roomId: string): Promise<RepairRequest[]> => {
  try {
    const requestsRef = ref(db, 'repairRequests');
    const roomQuery = query(requestsRef, orderByChild('roomId'), equalTo(roomId));
    const snapshot = await get(roomQuery);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    return Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
  } catch (error) {
    console.error('Error getting room repair requests:', error);
    throw error;
  }
};

export const subscribeToRepairRequests = (callback: (requests: RepairRequest[]) => void) => {
  const requestsRef = ref(db, 'repairRequests');
  return onValue(requestsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    const requests = Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
    
    callback(requests);
  });
};

export const subscribeToUserRepairRequests = (userId: string, callback: (requests: RepairRequest[]) => void) => {
  const requestsRef = ref(db, 'repairRequests');
  const userQuery = query(requestsRef, orderByChild('userId'), equalTo(userId));
  
  return onValue(userQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    const requests = Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
    
    callback(requests);
  });
};

export const subscribeToRoomRepairRequests = (roomId: string, callback: (requests: RepairRequest[]) => void) => {
  const requestsRef = ref(db, 'repairRequests');
  const roomQuery = query(requestsRef, orderByChild('roomId'), equalTo(roomId));
  
  return onValue(roomQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RepairRequest, 'id'>>;
    const requests = Object.entries(data).map(([id, requestData]) => ({
      id,
      ...requestData
    }));
    
    callback(requests);
  });
}; 