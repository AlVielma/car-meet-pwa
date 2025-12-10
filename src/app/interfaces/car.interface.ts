import { User } from './auth.interface';

export interface CarPhoto {
  id: number;
  url: string;
  isMain: boolean;
  caption?: string | null;
}

export interface Car {
  id: number;
  userId: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate?: string;
  description?: string;
  modifications?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  photos?: CarPhoto[];
}

export interface CreateCarRequest {
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate?: string;
  description?: string;
  modifications?: string;
  photo?: File;
}

export interface UpdateCarRequest {
  id: number;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  description?: string;
  modifications?: string;
  photo?: File;
}

// Offline Support Interfaces
export interface PendingCar extends CreateCarRequest {
  tempId: string;            // Temporary ID generated locally
  createdAt: number;         // Timestamp of offline creation
  photoBase64?: string;      // Photo as base64 for offline storage
  syncAttempts?: number;     // Number of sync attempts
  lastSyncAttempt?: number;  // Timestamp of last sync attempt
  syncError?: string;        // Error message if sync failed
}

export interface CarWithStatus extends Car {
  isPending?: boolean;  // True if car is pending sync from offline
  tempId?: string;      // Temporary ID for pending cars
  syncError?: boolean;  // True if sync failed
}

