import { User } from '@/types';
import CryptoJS from 'crypto-js';
import { get, off, onValue, ref, remove, set, update } from 'firebase/database';
import { db } from './firebase/init';

interface CreateUserData extends Omit<User, 'id' | 'uid'> {
  password: string;
}

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const usersRef = ref(db, 'users');
  
  onValue(usersRef, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        id: childSnapshot.key!,
        uid: childSnapshot.key!,
        ...userData,
      });
    });
    callback(users);
  });

  return () => {
    off(usersRef);
  };
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users: User[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        id: childSnapshot.key!,
        uid: childSnapshot.key!,
        ...userData,
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const hashedPassword = CryptoJS.SHA256(userData.password).toString();
    const userId = CryptoJS.lib.WordArray.random(16).toString();

    const { password, ...userWithoutPassword } = userData;
    const newUser: User = {
      id: userId,
      uid: userId,
      ...userWithoutPassword,
      password: hashedPassword,
    };

    await set(ref(db, `users/${userId}`), newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, data);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}; 