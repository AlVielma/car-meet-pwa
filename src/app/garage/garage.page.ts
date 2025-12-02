import { Component } from '@angular/core';
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
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonChip,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { car, add, camera, settings, calendar, trophy, star } from 'ionicons/icons';

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
    IonButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonChip,
    IonGrid,
    IonRow,
    IonCol
  ],
})
export class GaragePage {
  constructor() {
    addIcons({ car, add, camera, settings, calendar, trophy, star });
  }

  // Datos de ejemplo para los autos
  myCars = [
    {
      id: 1,
      brand: 'Honda',
      model: 'Civic Type R',
      year: 2020,
      color: 'Championship White',
      licensePlate: 'ABC-123',
      description: 'Mi Honda Civic Type R completamente modificado',
      modifications: 'Suspensión coilover, escape deportivo, rines 18"',
      isMain: true,
      photos: 5,
      participations: 12,
      votes: 45
    },
    {
      id: 2,
      brand: 'Toyota',
      model: 'Supra MK4',
      year: 1998,
      color: 'Black',
      licensePlate: 'XYZ-789',
      description: 'Toyota Supra clásico en perfecto estado',
      modifications: 'Motor 2JZ-GTE, turbo, intercooler',
      isMain: false,
      photos: 8,
      participations: 8,
      votes: 67
    }
  ];

  recentParticipations = [
    {
      id: 1,
      eventName: 'Car Meet Downtown',
      carName: 'Honda Civic Type R',
      date: '2024-01-15',
      status: 'CONFIRMED',
      position: 1
    },
    {
      id: 2,
      eventName: 'Tuning Show 2024',
      carName: 'Toyota Supra MK4',
      date: '2024-01-10',
      status: 'CONFIRMED',
      position: 3
    }
  ];

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

  getTotalParticipations(): number {
    return this.myCars.reduce((total, car) => total + car.participations, 0);
  }

  getTotalVotes(): number {
    return this.myCars.reduce((total, car) => total + car.votes, 0);
  }
}
