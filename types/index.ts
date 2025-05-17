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
  imageUrl?: string;
  currentGuest?: {
    uid: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  lastCleaned: string;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'in_progress';
  doorStatus: 'locked' | 'unlocked';
  lightStatus: 'on' | 'off';
  humidity: number;
  doorActions: {
    [key: string]: {
      action: 'unlock' | 'lock' | 'auto_lock';
      userId: string;
      userName: string;
      timestamp: string;
      type: 'manual' | 'auto';
    };
  };
  lastDoorAction?: {
    action: 'unlock' | 'lock' | 'auto_lock';
    userId: string;
    userName: string;
    timestamp: string;
    type: 'manual' | 'auto';
  };
  price: {
    perNight: number;
    currency: string;
  };
  description: string;
  additionalInfo: {
    floor: number;
    area: number; // площадь в м²
    maxGuests: number;
    amenities: string[]; // удобства: wifi, tv, minibar и т.д.
    view: 'city' | 'sea' | 'garden' | 'mountain';
    bedType: 'single' | 'double' | 'king' | 'twin';
    bathroomType: 'private' | 'shared';
    smokingAllowed: boolean;
    petsAllowed: boolean;
  };
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