import { User, UserSettings } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { db } from './firebase/config';

const USER_STORAGE_KEY = '@user';

const defaultSettings: UserSettings = {
  pushNotifications: true,
  emailNotifications: true,
  soundEnabled: true,
};

export const saveUserToStorage = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

export const getUserFromStorage = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    // Преобразуем строковые даты обратно в объекты Date
    user.createdAt = new Date(user.createdAt);
    user.updatedAt = new Date(user.updatedAt);
    if (user.currentGuest) {
      user.currentGuest.checkIn = new Date(user.currentGuest.checkIn);
      user.currentGuest.checkOut = new Date(user.currentGuest.checkOut);
    }
    return user;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

export const removeUserFromStorage = async () => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user from storage:', error);
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'user',
  phone?: string
): Promise<User> => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 
  const user: User = {
    id: userCredential.user.uid,
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    name,
    role,
    settings: defaultSettings,
  };

  saveUserToStorage(user); 

  await set(ref(db, `users/${userCredential.user.uid}`), {
    ...user,
    phone,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userSnapshot = await get(ref(db, `users/${userCredential.user.uid}`));
  const userData = userSnapshot.val();

  const user: User = {
    id: userCredential.user.uid,
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    name: userData?.name || '',
    role: userData?.role || 'cleaner',
    settings: userData?.settings || defaultSettings,
    pushToken: userData?.pushToken,
  };

  saveUserToStorage(user); 
  
  return user;
};

export const logoutUser = async (): Promise<void> => {
  const auth = getAuth();
  await signOut(auth);
  await removeUserFromStorage();
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };
    await update(userRef, updatedData);
    
    // Обновляем данные в локальном хранилище
    const currentUser = await getUserFromStorage();
    if (currentUser) {
      await saveUserToStorage({ ...currentUser, ...updatedData });
    }
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;

  const userSnapshot = await get(ref(db, `users/${user.uid}`));
  const userData = userSnapshot.val();

  return {
    id: user.uid,
    uid: user.uid,
    email: user.email!,
    name: userData?.name || '',
    role: userData?.role || 'cleaner',
    settings: userData?.settings || defaultSettings,
    pushToken: userData?.pushToken,
  };
};

export const createUserByAdmin = async (
  email: string,
  password: string,
  name: string,
  role: 'user' | 'cleaner' | 'admin',
  phone?: string
): Promise<User> => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 
  const user: User = {
    id: userCredential.user.uid,
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    name,
    role,
    settings: defaultSettings,
    phone,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await set(ref(db, `users/${userCredential.user.uid}`), user);
  return user;
}; 