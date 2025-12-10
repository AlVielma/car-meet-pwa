import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonChip,
  ModalController,
  ToastController,
  AlertController,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonThumbnail,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  car, add, camera, settings, calendar, trophy, star, create, trash, close,
  carSportOutline, colorPaletteOutline, cardOutline, addCircleOutline, listOutline, timeOutline,
  cloudUploadOutline, alertCircle, refresh
} from 'ionicons/icons';
import { CarService } from '../services/car.service';
import { Car, CreateCarRequest, UpdateCarRequest, CarWithStatus } from '../interfaces/car.interface';
import { CarModalComponent } from './car-modal/car-modal.component';
import { NetworkService } from '../services/network.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-garage',
  templateUrl: 'garage.page.html',
  styleUrls: ['garage.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonChip,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonThumbnail,
    IonFab,
    IonFabButton
  ],
})
export class GaragePage implements OnInit {
  myCars: CarWithStatus[] = [];
  isOnline = true;
  private networkSubscription?: Subscription;
  isLoading = false;

  // Datos de ejemplo para participaciones (se mantendrán estáticos por ahora)
  recentParticipations = [
    {
      id: 1,
      eventName: 'Car Meet Downtown',
      carName: 'Honda Civic Type R',
      date: '2024-01-15',
      status: 'CONFIRMED',
      position: 1
    }
  ];

  constructor(
    private carService: CarService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private networkService: NetworkService
  ) {
    addIcons({
      car, add, camera, settings, calendar, trophy, star, create, trash, close,
      'car-sport-outline': carSportOutline,
      'color-palette-outline': colorPaletteOutline,
      'card-outline': cardOutline,
      'add-circle-outline': addCircleOutline,
      'list-outline': listOutline,
      'time-outline': timeOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'alert-circle': alertCircle,
      'refresh': refresh
    });
  }

  ngOnInit() {
    this.isOnline = this.networkService.isOnline;
    this.loadCars();

    // Listen to network status changes for auto-sync
    this.networkSubscription = this.networkService.isOnline$.subscribe(async (online) => {
      this.isOnline = online;
      if (online) {
        console.log('Connection restored, syncing pending cars...');
        await this.syncPendingCars();
      }
    });
  }

  ngOnDestroy() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }

  async loadCars(event?: any) {
    this.isLoading = true;
    try {
      this.myCars = await this.carService.getMyCarsWithOffline();
      this.isLoading = false;
      if (event) event.target.complete();
    } catch (error) {
      console.error('Error loading cars', error);
      this.showToast('Error al cargar los autos', 'danger');
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }

  getCarImageUrl(car: Car): string {
    if (!car.photos || car.photos.length === 0) {
      return 'assets/img/car-placeholder.png';
    }

    const photoUrl = car.photos[0].url;

    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }

    // Si la URL viene del backend como ruta relativa (ej: uploads/...)
    // Construimos la URL completa usando la base del API
    const baseUrl = environment.apiUrl.replace('/api', '');
    // Aseguramos que no haya doble slash
    const cleanPath = photoUrl.replace(/\\/g, '/');
    const finalUrl = `${baseUrl}/${cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath}`;

    return finalUrl;
  }

  handleImageError(event: any) {
    // Fallback a una imagen en base64 gris simple si falla la carga
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3QgZmlsbD0iI2VlZSIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  async openCarModal(carToEdit?: Car) {
    const modal = await this.modalCtrl.create({
      component: CarModalComponent,
      componentProps: {
        car: carToEdit
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      if (carToEdit) {
        this.updateCar(carToEdit.id, data);
      } else {
        this.createCar(data);
      }
    }
  }

  async createCar(data: any) {
    this.isLoading = true;
    const request: CreateCarRequest = {
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      licensePlate: data.licensePlate,
      description: data.description,
      modifications: data.modifications,
      photo: data.photo
    };

    // Check if online
    if (this.networkService.isOnline) {
      // Online: try to create directly
      this.carService.createCar(request).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToast('Auto creado exitosamente', 'success');
            this.loadCars();
          }
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
        }
      });
    } else {
      // Offline: save to IndexedDB
      try {
        await this.carService.createCarOffline(request);
        this.showToast('Auto creado correctamente. Se sincronizará cuando vuelva la conexión.', 'success');
        await this.loadCars();
        this.isLoading = false;
      } catch (error) {
        console.error('Error creating car offline:', error);
        this.showToast('Error al crear el auto offline', 'danger');
        this.isLoading = false;
      }
    }
  }

  updateCar(id: number, data: any) {
    this.isLoading = true;
    const request: UpdateCarRequest = {
      id: id,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      licensePlate: data.licensePlate,
      description: data.description,
      modifications: data.modifications,
      photo: data.photo
    };

    this.carService.updateCar(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('Auto actualizado exitosamente', 'success');
          this.loadCars();
        }
      },
      error: (error) => {
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }

  async syncPendingCars() {
    try {
      const result = await this.carService.syncPendingCars();
      if (result.success > 0) {
        this.showToast(`${result.success} auto(s) sincronizado(s) exitosamente`, 'success');
        // Force refresh from server to get newly synced cars
        this.myCars = await this.carService.getMyCarsWithOffline(true);
      }
      if (result.failed > 0) {
        this.showToast(`${result.failed} auto(s) no se pudieron sincronizar`, 'warning');
      }
    } catch (error) {
      console.error('Error syncing pending cars:', error);
    }
  }

  async retrySyncCar(car: CarWithStatus) {
    if (!car.tempId) return;

    this.isLoading = true;
    try {
      const success = await this.carService.retrySyncCar(car.tempId);
      if (success) {
        this.showToast('Auto sincronizado exitosamente', 'success');
        await this.loadCars();
      } else {
        this.showToast('No se pudo sincronizar el auto. Intenta nuevamente más tarde.', 'danger');
      }
    } catch (error) {
      this.showToast('Error al sincronizar el auto', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async handleError(error: any) {
    let message = 'Ha ocurrido un error';
    if (error.error && error.error.errors && Array.isArray(error.error.errors)) {
      message = error.error.errors.map((e: any) => e.msg).join('\n');
    } else if (error.error && error.error.message) {
      message = error.error.message;
    }

    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'medium';
    }
  }

  getPositionIcon(position: number): string {
    switch (position) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'medal';
      default: return 'star';
    }
  }

  getPositionColor(position: number): string {
    switch (position) {
      case 1: return 'warning';
      case 2: return 'medium';
      case 3: return 'tertiary';
      default: return 'primary';
    }
  }
}
