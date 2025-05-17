export type UserSettings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
};

export type User = {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'cleaner' | 'user';
  settings: UserSettings;
  pushToken?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface Room {
  id: string;
  number: string;
  beds: number;
  rooms: number;
  isOccupied: boolean;
  currentGuest?: {
    uid: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  lastCleaned: string;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'in_progress';
}

export interface CleaningRecord {
  id: string;
  roomId: string;
  cleanerId: string;
  cleanedAt: Date;
  status: 'completed' | 'in_progress';
  notes?: string;
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'cleaning' | 'reservation' | 'system';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
};

export interface Reservation {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export type CleaningRequest = {
  id: string;
  roomId: string;
  userId: string;
  reservationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestType: 'regular' | 'urgent';
  notes?: string;
  assignedTo: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
};