import { User } from '@/types';
import { get, ref, set, update, remove, onValue, off } from 'firebase/database';
import { db } from './firebase/config';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

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
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const { password, ...userWithoutPassword } = userData;
    const newUser: User = {
      id: userCredential.user.uid,
      uid: userCredential.user.uid,
      ...userWithoutPassword,
    };

    await set(ref(db, `users/${userCredential.user.uid}`), newUser);
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