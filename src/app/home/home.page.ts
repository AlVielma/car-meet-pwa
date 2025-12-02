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
  IonCardSubtitle,
  IonButton,
  IonBadge,
  IonItem,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { calendar, location, time, people } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
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
    IonBadge,
    IonItem,
    IonLabel,
    IonIcon,
    RouterModule
  ],
})
export class HomePage {
  constructor() {
    addIcons({ calendar, location, time, people });
  }

  upcomingEvents = [
    {
      id: 1,
      name: 'Car Meet Downtown',
      location: 'Plaza Central',
      date: '2024-01-15',
      time: '18:00',
      participants: 45,
      status: 'ACTIVE'
    },
    {
      id: 2,
      name: 'Tuning Show 2024',
      location: 'Centro de Convenciones',
      date: '2024-01-20',
      time: '10:00',
      participants: 120,
      status: 'ACTIVE'
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
}
