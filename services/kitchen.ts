import { equalTo, get, onValue, orderByChild, query, ref, remove, set } from 'firebase/database';
import { db } from './firebase/config';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  createdAt?: number;
  updatedAt?: number;
}

export const createMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const menuRef = ref(db, 'menuItems');
    const newMenuItemRef = ref(db, 'menuItems/' + Date.now());
    const timestamp = Date.now();
    const newItem = {
      ...menuItem,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await set(newMenuItemRef, newItem);
    const id = newMenuItemRef.key || Date.now().toString();
    return { id, ...newItem };
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (id: string, menuItem: Partial<MenuItem>) => {
  try {
    const menuItemRef = ref(db, `menuItems/${id}`);
    const updateData = {
      ...menuItem,
      updatedAt: Date.now()
    };
    await set(menuItemRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

export const deleteMenuItem = async (id: string) => {
  try {
    const menuItemRef = ref(db, `menuItems/${id}`);
    await remove(menuItemRef);
    return id;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

export const getMenuItems = async () => {
  try {
    const menuRef = ref(db, 'menuItems');
    const snapshot = await get(menuRef);
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<MenuItem, 'id'>>;
    return Object.entries(data).map(([id, itemData]) => ({
      id,
      ...itemData
    })) as MenuItem[];
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

export const getMenuItemsByCategory = async (category: string) => {
  try {
    const menuRef = ref(db, 'menuItems');
    const categoryQuery = query(menuRef, orderByChild('category'), equalTo(category));
    const snapshot = await get(categoryQuery);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val() as Record<string, Omit<MenuItem, 'id'>>;
    return Object.entries(data).map(([id, itemData]) => ({
      id,
      ...itemData
    })) as MenuItem[];
  } catch (error) {
    console.error('Error getting menu items by category:', error);
    throw error;
  }
};

export const subscribeToMenuItems = (callback: (items: MenuItem[]) => void) => {
  const menuRef = ref(db, 'menuItems');
  return onValue(menuRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<MenuItem, 'id'>>;
    const items = Object.entries(data).map(([id, itemData]) => ({
      id,
      ...itemData
    })) as MenuItem[];
    
    callback(items);
  });
};

export const subscribeToMenuItemsByCategory = (category: string, callback: (items: MenuItem[]) => void) => {
  const menuRef = ref(db, 'menuItems');
  const categoryQuery = query(menuRef, orderByChild('category'), equalTo(category));
  
  return onValue(categoryQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val() as Record<string, Omit<MenuItem, 'id'>>;
    const items = Object.entries(data).map(([id, itemData]) => ({
      id,
      ...itemData
    })) as MenuItem[];
    
    callback(items);
  });
}; 