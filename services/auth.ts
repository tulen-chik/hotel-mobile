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

// Проверка существования пользователя по email
async function isUserExists(email: string): Promise<boolean> {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return false;

    const users = snapshot.val();
    return Object.values(users).some((user: any) => user.email === email);
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
  role: 'user',
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

    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 
      const user: User = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        name: name.trim(),
        role,
        settings: defaultSettings,
      };

      await saveUserToStorage(user); 

      await set(ref(db, `users/${userCredential.user.uid}`), {
        ...user,
        phone: phone?.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return user;
    } catch (error: any) {
      console.error('Firebase auth error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Пользователь с таким email уже существует');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Некорректный формат email');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Пароль слишком простой');
      }
      throw new Error('Ошибка при регистрации');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error; // Пробрасываем ошибку дальше
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('[DEBUG] Login attempt for email:', email);
    
    // Проверки
    if (!email || !password) {
      console.log('[DEBUG] Missing email or password');
      throw new Error('Email и пароль обязательны');
    }

    if (!isValidEmail(email)) {
      console.log('[DEBUG] Invalid email format:', email);
      throw new Error('Некорректный формат email. Пример: user@example.com');
    }

    const auth = getAuth();
    try {
      console.log('[DEBUG] Attempting Firebase authentication');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[DEBUG] Firebase auth successful, fetching user data');
      
      const userSnapshot = await get(ref(db, `users/${userCredential.user.uid}`));
      
      if (!userSnapshot.exists()) {
        console.log('[DEBUG] User data not found in database');
        throw new Error('Пользователь не найден');
      }

      const userData = userSnapshot.val();
      const user: User = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        name: userData?.name || '',
        role: userData?.role || 'user',
        settings: userData?.settings || defaultSettings,
        pushToken: userData?.pushToken,
      };

      console.log('[DEBUG] User data retrieved successfully');
      await saveUserToStorage(user); 
      return user;
    } catch (error: any) {
      console.error('[DEBUG] Firebase auth error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('Пользователь не найден. Проверьте правильность email');
      }
      if (error.code === 'auth/wrong-password') {
        throw new Error('Неверный пароль');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Некорректный формат email. Пример: user@example.com');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Слишком много попыток входа. Попробуйте позже');
      }
      throw new Error(`Ошибка при входе: ${error.message}`);
    }
  } catch (error) {
    console.error('[DEBUG] Login error:', error);
    throw error;
  }
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

    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 
    const user: User = {
      id: userCredential.user.uid,
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      name: name.trim(),
      role,
      settings: defaultSettings,
      phone: phone?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(db, `users/${userCredential.user.uid}`), user);
    return user;
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Пользователь с таким email уже существует');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Некорректный формат email');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Пароль слишком простой');
    }
    throw new Error(error.message || 'Ошибка при создании пользователя');
  }
}; 