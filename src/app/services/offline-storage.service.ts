import { Injectable } from '@angular/core';
import { PendingCar } from '../interfaces/car.interface';

@Injectable({
    providedIn: 'root'
})
export class OfflineStorageService {
    private readonly DB_NAME = 'CarMeetDB';
    private readonly DB_VERSION = 1;
    private readonly PENDING_CARS_STORE = 'pendingCars';
    private readonly CACHED_CARS_STORE = 'cachedCars';
    private readonly CACHED_IMAGES_STORE = 'cachedImages';
    private db: IDBDatabase | null = null;

    constructor() {
        this.initDatabase();
    }

    private async initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;

                // Store for pending cars (not yet synced)
                if (!db.objectStoreNames.contains(this.PENDING_CARS_STORE)) {
                    const pendingStore = db.createObjectStore(this.PENDING_CARS_STORE, { keyPath: 'tempId' });
                    pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Store for cached cars (already synced)
                if (!db.objectStoreNames.contains(this.CACHED_CARS_STORE)) {
                    db.createObjectStore(this.CACHED_CARS_STORE, { keyPath: 'id' });
                }

                // Store for cached images
                if (!db.objectStoreNames.contains(this.CACHED_IMAGES_STORE)) {
                    db.createObjectStore(this.CACHED_IMAGES_STORE, { keyPath: 'key' });
                }
            };
        });
    }

    private async ensureDb(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.initDatabase();
        }
        return this.db!;
    }

    // Pending Cars Operations
    async savePendingCar(car: PendingCar): Promise<void> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.PENDING_CARS_STORE], 'readwrite');
            const store = transaction.objectStore(this.PENDING_CARS_STORE);
            const request = store.put(car);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingCars(): Promise<PendingCar[]> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.PENDING_CARS_STORE], 'readonly');
            const store = transaction.objectStore(this.PENDING_CARS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async removePendingCar(tempId: string): Promise<void> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.PENDING_CARS_STORE], 'readwrite');
            const store = transaction.objectStore(this.PENDING_CARS_STORE);
            const request = store.delete(tempId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updatePendingCar(car: PendingCar): Promise<void> {
        return this.savePendingCar(car);
    }

    // Cached Cars Operations
    async cacheCars(cars: any[]): Promise<void> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.CACHED_CARS_STORE], 'readwrite');
            const store = transaction.objectStore(this.CACHED_CARS_STORE);

            // Clear existing cache
            store.clear();

            // Add all cars
            cars.forEach(car => store.put(car));

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getCachedCars(): Promise<any[]> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.CACHED_CARS_STORE], 'readonly');
            const store = transaction.objectStore(this.CACHED_CARS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // Image Cache Operations
    async cacheImage(key: string, base64Data: string): Promise<void> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.CACHED_IMAGES_STORE], 'readwrite');
            const store = transaction.objectStore(this.CACHED_IMAGES_STORE);
            const request = store.put({ key, data: base64Data, timestamp: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCachedImage(key: string): Promise<string | null> {
        const db = await this.ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.CACHED_IMAGES_STORE], 'readonly');
            const store = transaction.objectStore(this.CACHED_IMAGES_STORE);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Utility to convert File to base64
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Utility to convert base64 to File
    base64ToFile(base64: string, filename: string): File {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }
}
