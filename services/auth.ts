import { User, UserSettings } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { equalTo, get, orderByChild, query, ref, set, update } from 'firebase/database';
import { db } from './firebase/init';

const USER_STORAGE_KEY = '@user';
const SESSION_KEY = '@session';

const defaultSettings: UserSettings = {
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

// Хеширование пароля
function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Проверка существования пользователя по email
async function isUserExists(email: string): Promise<boolean> {
  try {
    const usersRef = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    const snapshot = await get(usersRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw new Error('Ошибка при проверке существования пользователя');
  }
}

// Валидация email
function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());
  console.log(`[DEBUG] Email validation for "${email}": ${isValid}`);
  return isValid;
}

// Валидация пароля
function isValidPassword(password: string): boolean {
  if (!password) return false;
  return password.length >= 6;
}

// Валидация имени
function isValidName(name: string): boolean {
  if (!name) return false;
  return name.trim().length >= 2;
}

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'user' | 'cleaner' | 'repairer' | 'admin' = 'user',
  phone?: string
): Promise<User> => {
  try {
    // Проверки
    if (!email || !password || !name) {
      throw new Error('Все поля обязательны для заполнения');
    }

    if (!isValidEmail(email)) {
      throw new Error('Некорректный формат email');
    }

    if (!isValidPassword(password)) {
      throw new Error('Пароль должен содержать минимум 6 символов');
    }

    if (!isValidName(name)) {
      throw new Error('Имя должно содержать минимум 2 символа');
    }

    const exists = await isUserExists(email);
    if (exists) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const hashedPassword = hashPassword(password);
    const userId = CryptoJS.lib.WordArray.random(16).toString();

    const user: User = {
      id: userId,
      uid: userId,
      email: email.trim(),
      name: name.trim(),
      role,
      settings: defaultSettings,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(ref(db, `users/${userId}`), user);
    await saveUserToStorage(user);
    await AsyncStorage.setItem(SESSION_KEY, userId);

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('[DEBUG] Login attempt for email:', email);
    
    if (!email || !password) {
      console.log('[DEBUG] Missing email or password');
      throw new Error('Email и пароль обязательны');
    }

    if (!isValidEmail(email)) {
      console.log('[DEBUG] Invalid email format:', email);
      throw new Error('Некорректный формат email. Пример: user@example.com');
    }

    const usersRef = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      throw new Error('Пользователь не найден');
    }

    const users = snapshot.val();
    const userId = Object.keys(users)[0];
    const userData = users[userId];

    const hashedPassword = hashPassword(password);
    if (userData.password !== hashedPassword) {
      throw new Error('Неверный пароль');
    }

    const user: User = {
      id: userId,
      uid: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      settings: userData.settings || defaultSettings,
    };

    await saveUserToStorage(user);
    await AsyncStorage.setItem(SESSION_KEY, userId);
    return user;
  } catch (error) {
    console.error('[DEBUG] Login error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  await removeUserFromStorage();
  await AsyncStorage.removeItem(SESSION_KEY);
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  try {
    // Проверка существования пользователя
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error('Пользователь не найден');
    }

    // Если обновляется email, проверяем его уникальность
    if (data.email) {
      if (!isValidEmail(data.email)) {
        throw new Error('Некорректный формат email');
      }
      const exists = await isUserExists(data.email);
      if (exists) {
        throw new Error('Пользователь с таким email уже существует');
      }
    }

    // Если обновляется имя, проверяем его валидность
    if (data.name && !isValidName(data.name)) {
      throw new Error('Имя должно содержать минимум 2 символа');
    }

    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await update(userRef, updatedData);
    
    // Обновляем данные в локальном хранилище
    const currentUser = await getUserFromStorage();
    if (currentUser) {
      await saveUserToStorage({ ...currentUser, ...updatedData });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Ошибка при обновлении профиля');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const sessionId = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionId) return null;

    const userSnapshot = await get(ref(db, `users/${sessionId}`));
    if (!userSnapshot.exists()) return null;

    const userData = userSnapshot.val();
    return {
      id: userData.id,
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      settings: userData.settings || defaultSettings,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const createUserByAdmin = async (
  email: string,
  password: string,
  name: string,
  role: 'user' | 'cleaner' | 'admin',
  phone?: string
): Promise<User> => {
  try {
    if (!email || !password || !name) {
      throw new Error('Все поля обязательны для заполнения');
    }

    if (!isValidEmail(email)) {
      throw new Error('Некорректный формат email');
    }

    if (!isValidPassword(password)) {
      throw new Error('Пароль должен содержать минимум 6 символов');
    }

    if (!isValidName(name)) {
      throw new Error('Имя должно содержать минимум 2 символа');
    }

    const exists = await isUserExists(email);
    if (exists) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const hashedPassword = hashPassword(password);
    const userId = CryptoJS.lib.WordArray.random(16).toString();

    const user: User = {
      id: userId,
      uid: userId,
      email: email.trim(),
      name: name.trim(),
      role,
      settings: defaultSettings,
      password: hashedPassword,
      phone: phone?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(db, `users/${userId}`), user);
    return user;
  } catch (error: any) {
    console.error('Create user error:', error);
    throw new Error(error.message || 'Ошибка при создании пользователя');
  }
}; 