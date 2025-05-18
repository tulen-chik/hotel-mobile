import { equalTo, get, onValue, orderByChild, query, ref, remove, set } from 'firebase/database';
import { db } from './firebase/config';

export interface RoomServiceOrder {
  id?: string;
  userId: string;
  roomId: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  deliveredBy?: string;
}

export const createRoomServiceOrder = async (order: Omit<RoomServiceOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const ordersRef = ref(db, 'roomServiceOrders');
    const newOrderRef = ref(db, 'roomServiceOrders/' + Date.now());
    const timestamp = Date.now();
    const newOrder = {
      ...order,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await set(newOrderRef, newOrder);
    const id = newOrderRef.key || Date.now().toString();
    return { id, ...newOrder };
  } catch (error) {
    console.error('Error creating room service order:', error);
    throw error;
  }
};

export const updateRoomServiceOrder = async (id: string, order: Partial<RoomServiceOrder>) => {
  try {
    const orderRef = ref(db, `roomServiceOrders/${id}`);
    const updateData = {
      ...order,
      updatedAt: Date.now()
    };
    await set(orderRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating room service order:', error);
    throw error;
  }
};

export const deleteRoomServiceOrder = async (id: string) => {
  try {
    const orderRef = ref(db, `roomServiceOrders/${id}`);
    await remove(orderRef);
    return id;
  } catch (error) {
    console.error('Error deleting room service order:', error);
    throw error;
  }
};

export const getRoomServiceOrders = async () => {
  try {
    const ordersRef = ref(db, 'roomServiceOrders');
    const snapshot = await get(ordersRef);
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    return Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
  } catch (error) {
    console.error('Error getting room service orders:', error);
    throw error;
  }
};

export const getRoomServiceOrdersByUser = async (userId: string) => {
  try {
    const ordersRef = ref(db, 'roomServiceOrders');
    const userQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userQuery);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    return Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
  } catch (error) {
    console.error('Error getting user room service orders:', error);
    throw error;
  }
};

export const getRoomServiceOrdersByRoom = async (roomId: string) => {
  try {
    const ordersRef = ref(db, 'roomServiceOrders');
    const roomQuery = query(ordersRef, orderByChild('roomId'), equalTo(roomId));
    const snapshot = await get(roomQuery);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    return Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
  } catch (error) {
    console.error('Error getting room service orders by room:', error);
    throw error;
  }
};

export const subscribeToRoomServiceOrders = (callback: (orders: RoomServiceOrder[]) => void) => {
  const ordersRef = ref(db, 'roomServiceOrders');
  return onValue(ordersRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    const orders = Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
    
    callback(orders);
  });
};

export const subscribeToUserRoomServiceOrders = (userId: string, callback: (orders: RoomServiceOrder[]) => void) => {
  const ordersRef = ref(db, 'roomServiceOrders');
  const userQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
  
  return onValue(userQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    const orders = Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
    
    callback(orders);
  });
};

export const subscribeToRoomServiceOrdersByRoom = (roomId: string, callback: (orders: RoomServiceOrder[]) => void) => {
  const ordersRef = ref(db, 'roomServiceOrders');
  const roomQuery = query(ordersRef, orderByChild('roomId'), equalTo(roomId));
  
  return onValue(roomQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<RoomServiceOrder, 'id'>>;
    const orders = Object.entries(data).map(([id, orderData]) => ({
      id,
      ...orderData
    })) as RoomServiceOrder[];
    
    callback(orders);
  });
}; 