import { initializeFirebaseSchemas } from './schemas';

export const initializeApp = async () => {
  try {
    await initializeFirebaseSchemas();
    console.log('Firebase schemas initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase schemas:', error);
    throw error;
  }
}; 