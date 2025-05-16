import { get, ref, set } from 'firebase/database';
import { db } from './config';

// Определение схем коллекций
const collections = {
  users: {
    fields: {
      id: 'string',
      uid: 'string',
      email: 'string',
      role: 'string', 
      name: 'string',
      phone: 'string?',
      settings: {
        pushNotifications: 'boolean',
        emailNotifications: 'boolean',
        soundEnabled: 'boolean'
      },
      pushToken: 'string?',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    indexes: [
      { fields: ['email'], type: 'ascending' },
      { fields: ['role'], type: 'ascending' }
    ]
  },
  rooms: {
    fields: {
      id: 'string',
      number: 'string',
      beds: 'number',
      rooms: 'number',
      isOccupied: 'boolean',
      currentGuest: {
        uid: 'string',
        name: 'string',
        checkIn: 'timestamp',
        checkOut: 'timestamp'
      },
      lastCleaned: 'timestamp',
      cleaningStatus: 'string' // 'clean' | 'needs_cleaning' | 'in_progress'
    },
    indexes: [
      { fields: ['isOccupied', 'number'], type: 'ascending' }
    ]
  },
  cleaning_records: {
    fields: {
      id: 'string',
      roomId: 'string',
      cleanerId: 'string',
      cleanedAt: 'timestamp',
      status: 'string', // 'completed' | 'in_progress'
      notes: 'string?'
    },
    indexes: [
      { fields: ['roomId', 'cleanedAt'], type: 'descending' },
      { fields: ['cleanerId', 'cleanedAt'], type: 'descending' }
    ]
  },
  notifications: {
    fields: {
      id: 'string',
      userId: 'string',
      title: 'string',
      body: 'string',
      type: 'string', // 'cleaning' | 'reservation' | 'system'
      data: 'map?',
      read: 'boolean',
      createdAt: 'timestamp'
    },
    indexes: [
      { fields: ['userId', 'createdAt'], type: 'descending' },
      { fields: ['type', 'createdAt'], type: 'descending' }
    ]
  },
  reservations: {
    fields: {
      id: 'string',
      userId: 'string',
      roomId: 'string',
      checkIn: 'timestamp',
      checkOut: 'timestamp',
      status: 'string', // 'active' | 'cancelled' | 'completed'
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    indexes: [
      { fields: ['userId', 'createdAt'], type: 'descending' },
      { fields: ['roomId', 'checkIn'], type: 'ascending' }
    ]
  },
  cleaning_requests: {
    fields: {
      id: 'string',
      roomId: 'string',
      userId: 'string',
      reservationId: 'string',
      status: 'string', // 'pending' | 'approved' | 'rejected' | 'completed'
      requestType: 'string', // 'regular' | 'urgent'
      notes: 'string?',
      assignedTo: 'string?', // cleaner's id
      assignedAt: 'timestamp?',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      completedAt: 'timestamp?',
      completedBy: 'string?' // cleaner's id
    },
    indexes: [
      { fields: ['status', 'createdAt'], type: 'descending' },
      { fields: ['roomId', 'status'], type: 'ascending' },
      { fields: ['userId', 'createdAt'], type: 'descending' },
      { fields: ['assignedTo', 'status'], type: 'ascending' }
    ]
  }
};

// Функция для создания схем и индексов
export const initializeFirebaseSchemas = async () => {
  try {
    // Проверяем существование коллекций
    for (const [collectionName, schema] of Object.entries(collections)) {
      const collectionRef = ref(db, collectionName);
      const snapshot = await get(collectionRef);
      
      if (!snapshot.exists()) {
        // Создаем тестовый документ для инициализации коллекции
        await set(collectionRef, {
          _schema: schema.fields,
          _indexes: schema.indexes,
          _createdAt: new Date()
        });
        
        console.log(`Collection ${collectionName} initialized with schema`);
      }
    }
    
    console.log('All Firebase schemas and indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase schemas:', error);
    throw error;
  }
}; 