import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';

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

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Database = getDatabase(app);

export { app, db };

