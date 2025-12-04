import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonIcon,
  IonAvatar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, location, time, people, checkmarkCircle, timeOutline, closeCircle, carSportOutline, calendarOutline, peopleOutline, chevronForwardOutline, locationOutline, imageOutline } from 'ionicons/icons';
import { EventService } from '../services/event.service';
import { Participation } from '../interfaces/event.interface';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
    IonIcon,
    IonAvatar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent
  ],
})
export class EventsPage implements OnInit {
  myParticipations: Participation[] = [];
  isLoading = true;

  constructor(private eventService: EventService) {
    addIcons({ 
      calendar, location, time, people, checkmarkCircle, timeOutline, closeCircle,
      'car-sport-outline': carSportOutline,
      'calendar-outline': calendarOutline,
      'people-outline': peopleOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'location-outline': locationOutline,
      'image-outline': imageOutline
    });
  }

  ngOnInit() {
    this.loadParticipations();
  }

  loadParticipations(event?: any) {
    this.eventService.getMyParticipations().subscribe({
      next: (response) => {
        this.myParticipations = response.data || [];
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error loading participations', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      case 'REJECTED': return 'danger';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'PENDING': return 'Pendiente';
      case 'CANCELLED': return 'Cancelado';
      case 'REJECTED': return 'Rechazado';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getEventImageUrl(participation: Participation): string | undefined {
    if (participation.event.photos && participation.event.photos.length > 0) {
      const photoUrl = participation.event.photos[0].url;
      if (photoUrl.startsWith('http')) return photoUrl;
      
      const baseUrl = environment.apiUrl.replace('/api', '');
      const cleanPath = photoUrl.replace(/\\/g, '/');
      return `${baseUrl}/${cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath}`;
    }
    return undefined;
  }
}
