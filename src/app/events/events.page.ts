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
  IonBadge,
  IonItem,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, location, time, people, checkmarkCircle, timeOutline, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
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
    IonBadge,
    IonItem,
    IonLabel,
    IonIcon
  ],
})
export class EventsPage {
  constructor() {
    addIcons({ calendar, location, time, people, checkmarkCircle, timeOutline, closeCircle });
  }



  myEvents = [
    {
      id: 3,
      name: 'Mi Evento Personal',
      location: 'Mi Garage',
      date: '2024-01-25',
      time: '19:00',
      participants: 15,
      status: 'ACTIVE',
      isOrganizer: true
    }
  ];

  myParticipations = [
    {
      id: 1,
      eventName: 'Car Meet Downtown',
      carName: 'Mi Honda Civic',
      status: 'CONFIRMED',
      date: '2024-01-15'
    },
    {
      id: 2,
      eventName: 'Tuning Show 2024',
      carName: 'Mi Honda Civic',
      status: 'PENDING',
      date: '2024-01-20'
    }
  ];

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'CANCELLED': return 'danger';
      case 'FINISHED': return 'medium';
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'checkmark-circle';
      case 'PENDING': return 'time-outline';
      case 'CANCELLED': return 'close-circle';
      default: return 'calendar';
    }
  }
}
