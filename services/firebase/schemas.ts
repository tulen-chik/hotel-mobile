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
        soundEnabled: 'boolean'
      },
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    indexes: [
      { fields: ['email'], type: 'ascending' },
      { fields: ['role'], type: 'ascending' }
    ]
  },
  menuItems: {
    fields: {
      id: 'string',
      name: 'string',
      description: 'string',
      price: 'number',
      category: 'string',
      imageUrl: 'string?',
      isAvailable: 'boolean',
      preparationTime: 'number',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    indexes: [
      { fields: ['category'], type: 'ascending' },
      { fields: ['isAvailable'], type: 'ascending' },
      { fields: ['price'], type: 'ascending' }
    ]
  },
  rooms: {
    fields: {
      id: 'string',
      number: 'string',
      beds: 'number',
      rooms: 'number',
      isOccupied: 'boolean',
      imageUrl: 'string?', // Optional URL to the room's image
      currentGuest: {
        uid: 'string',
        name: 'string',
        checkIn: 'timestamp',
        checkOut: 'timestamp'
      },
      lastCleaned: 'timestamp',
      cleaningStatus: 'string', // 'clean' | 'needs_cleaning' | 'in_progress'
      // Новые поля для управления комнатой
      doorStatus: 'string', // 'locked' | 'unlocked'
      lightStatus: 'string', // 'on' | 'off'
      humidity: 'number', // значение влажности в процентах
      doorActions: {
        type: 'map',
        fields: {
          action: 'string', // 'unlock' | 'lock' | 'auto_lock'
          userId: 'string',
          userName: 'string',
          timestamp: 'timestamp',
          type: 'string' // 'manual' | 'auto'
        }
      },
      lastDoorAction: {
        action: 'string',
        userId: 'string',
        userName: 'string',
        timestamp: 'timestamp',
        type: 'string'
      }
    },
    indexes: [
      { fields: ['isOccupied', 'number'], type: 'ascending' },
      { fields: ['doorStatus', 'number'], type: 'ascending' },
      { fields: ['cleaningStatus', 'number'], type: 'ascending' }
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
    // Проверяем существование коллекций и создаем схемы
    for (const [collectionName, schema] of Object.entries(collections)) {
      const collectionRef = ref(db, collectionName);
      const schemaRef = ref(db, `_schemas/${collectionName}`);
      const snapshot = await get(collectionRef);
      const schemaSnapshot = await get(schemaRef);
      
      // Создаем пустую коллекцию, если она не существует
      if (!snapshot.exists()) {
        await set(collectionRef, {});
        console.log(`Collection ${collectionName} initialized`);
      }
      
      // Создаем схему, если она не существует
      if (!schemaSnapshot.exists()) {
        await set(schemaRef, {
          fields: schema.fields,
          indexes: schema.indexes,
          createdAt: new Date().toISOString()
        });
        console.log(`Schema for ${collectionName} initialized`);
      }
    }
    
    console.log('All Firebase collections and schemas initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase collections and schemas:', error);
    throw error;
  }
}; 