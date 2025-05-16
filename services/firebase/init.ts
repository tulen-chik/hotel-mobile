import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeFirebaseSchemas } from './schemas';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCYM1z31doeK0DBd27T8HXktqyJX2eyoBI",
    authDomain: "hotel-df8a5.firebaseapp.com",
    databaseURL: "https://hotel-df8a5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hotel-df8a5",
    storageBucket: "hotel-df8a5.firebasestorage.app",
    messagingSenderId: "1082785459044",
    appId: "1:1082785459044:web:70755f73715cff26486871",
    measurementId: "G-B802SQHC08"
  };

export const initializeFirebase = async () => {
  try {
    // Инициализация Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    // Инициализация схем
    await initializeFirebaseSchemas();
    
    console.log('Firebase initialized successfully');
    return { app, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}; 