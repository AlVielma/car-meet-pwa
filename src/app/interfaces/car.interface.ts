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
