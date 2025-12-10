import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/auth.interface';
import { Car, CreateCarRequest, UpdateCarRequest, PendingCar, CarWithStatus } from '../interfaces/car.interface';
import { AuthService } from './auth.service';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkService } from './network.service';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private networkService: NetworkService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMyCars(): Observable<ApiResponse<Car[]>> {
    return this.http.get<ApiResponse<Car[]>>(`${this.API_URL}/cars/my-cars`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Get cars combining server data with pending offline cars
  async getMyCarsWithOffline(): Promise<CarWithStatus[]> {
    const cars: CarWithStatus[] = [];

    // Try to get cars from server if online
    if (this.networkService.isOnline) {
      try {
        const response = await this.http.get<ApiResponse<Car[]>>(
          `${this.API_URL}/cars/my-cars`,
          { headers: this.getHeaders() }
        ).toPromise();

        if (response?.success && response.data) {
          cars.push(...response.data);
          // Cache cars for offline access
          await this.offlineStorage.cacheCars(response.data);
        }
      } catch (error) {
        console.error('Error fetching cars from server:', error);
        // If online but error, try to get from cache
        const cachedCars = await this.offlineStorage.getCachedCars();
        cars.push(...cachedCars);
      }
    } else {
      // Offline: get from cache
      const cachedCars = await this.offlineStorage.getCachedCars();
      cars.push(...cachedCars);
    }

    // Add pending cars with isPending flag
    const pendingCars = await this.offlineStorage.getPendingCars();
    const pendingCarsMapped: CarWithStatus[] = pendingCars.map(pc => ({
      id: 0, // Temporary, will be assigned by server
      userId: 0,
      brand: pc.brand,
      model: pc.model,
      year: pc.year,
      color: pc.color,
      licensePlate: pc.licensePlate,
      description: pc.description,
      modifications: pc.modifications,
      createdAt: new Date(pc.createdAt).toISOString(),
      updatedAt: new Date(pc.createdAt).toISOString(),
      isPending: true,
      tempId: pc.tempId,
      syncError: !!pc.syncError,
      photos: pc.photoBase64 ? [{
        id: 0,
        url: pc.photoBase64,
        isMain: true
      }] : []
    }));

    return [...pendingCarsMapped, ...cars];
  }

  createCar(carData: CreateCarRequest): Observable<ApiResponse<Car>> {
    const formData = new FormData();
    formData.append('brand', carData.brand);
    formData.append('model', carData.model);
    formData.append('year', carData.year.toString());
    formData.append('color', carData.color);

    if (carData.licensePlate) formData.append('licensePlate', carData.licensePlate);
    if (carData.description) formData.append('description', carData.description);
    if (carData.modifications) formData.append('modifications', carData.modifications);
    if (carData.photo) formData.append('image', carData.photo);

    return this.http.post<ApiResponse<Car>>(`${this.API_URL}/cars`, formData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Create car offline - save to IndexedDB
  async createCarOffline(carData: CreateCarRequest): Promise<PendingCar> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let photoBase64: string | undefined;
    if (carData.photo) {
      photoBase64 = await this.offlineStorage.fileToBase64(carData.photo);
    }

    const pendingCar: PendingCar = {
      tempId,
      createdAt: Date.now(),
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      color: carData.color,
      licensePlate: carData.licensePlate,
      description: carData.description,
      modifications: carData.modifications,
      photoBase64,
      syncAttempts: 0
    };

    await this.offlineStorage.savePendingCar(pendingCar);
    return pendingCar;
  }

  // Sync all pending cars to server
  async syncPendingCars(): Promise<{ success: number; failed: number }> {
    if (!this.networkService.isOnline) {
      return { success: 0, failed: 0 };
    }

    const pendingCars = await this.offlineStorage.getPendingCars();
    let successCount = 0;
    let failedCount = 0;

    for (const pendingCar of pendingCars) {
      try {
        // Convert base64 back to File if exists
        let photoFile: File | undefined;
        if (pendingCar.photoBase64) {
          photoFile = this.offlineStorage.base64ToFile(
            pendingCar.photoBase64,
            `car_${pendingCar.tempId}.jpg`
          );
        }

        const carData: CreateCarRequest = {
          brand: pendingCar.brand,
          model: pendingCar.model,
          year: pendingCar.year,
          color: pendingCar.color,
          licensePlate: pendingCar.licensePlate,
          description: pendingCar.description,
          modifications: pendingCar.modifications,
          photo: photoFile
        };

        const response = await this.createCar(carData).toPromise();

        if (response?.success) {
          // Success - remove from pending
          await this.offlineStorage.removePendingCar(pendingCar.tempId);
          successCount++;
        } else {
          throw new Error('Server responded with success=false');
        }
      } catch (error: any) {
        console.error(`Failed to sync car ${pendingCar.tempId}:`, error);

        // Update sync attempts
        pendingCar.syncAttempts = (pendingCar.syncAttempts || 0) + 1;
        pendingCar.lastSyncAttempt = Date.now();

        // Mark as error if too many attempts
        if (pendingCar.syncAttempts >= 3) {
          pendingCar.syncError = error.message || 'Error desconocido';
        }

        await this.offlineStorage.updatePendingCar(pendingCar);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  // Retry syncing a specific pending car
  async retrySyncCar(tempId: string): Promise<boolean> {
    if (!this.networkService.isOnline) {
      return false;
    }

    const pendingCars = await this.offlineStorage.getPendingCars();
    const pendingCar = pendingCars.find(pc => pc.tempId === tempId);

    if (!pendingCar) {
      return false;
    }

    try {
      let photoFile: File | undefined;
      if (pendingCar.photoBase64) {
        photoFile = this.offlineStorage.base64ToFile(
          pendingCar.photoBase64,
          `car_${pendingCar.tempId}.jpg`
        );
      }

      const carData: CreateCarRequest = {
        brand: pendingCar.brand,
        model: pendingCar.model,
        year: pendingCar.year,
        color: pendingCar.color,
        licensePlate: pendingCar.licensePlate,
        description: pendingCar.description,
        modifications: pendingCar.modifications,
        photo: photoFile
      };

      const response = await this.createCar(carData).toPromise();

      if (response?.success) {
        await this.offlineStorage.removePendingCar(pendingCar.tempId);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Retry failed for car ${tempId}:`, error);
      return false;
    }
  }

  updateCar(carData: UpdateCarRequest): Observable<ApiResponse<Car>> {
    const formData = new FormData();
    if (carData.brand) formData.append('brand', carData.brand);
    if (carData.model) formData.append('model', carData.model);
    if (carData.year) formData.append('year', carData.year.toString());
    if (carData.color) formData.append('color', carData.color);
    if (carData.licensePlate) formData.append('licensePlate', carData.licensePlate);
    if (carData.description) formData.append('description', carData.description);
    if (carData.modifications) formData.append('modifications', carData.modifications);
    if (carData.photo) formData.append('image', carData.photo);

    return this.http.put<ApiResponse<Car>>(`${this.API_URL}/cars/${carData.id}`, formData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en CarService:', error);
    return throwError(() => error);
  }
}
