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
  IonBadge,
  IonItem,
  IonLabel,
  IonIcon,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonAvatar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { calendar, location, time, people, search, filter, calendarOutline, locationOutline, timeOutline, peopleOutline, imageOutline, notificationsOutline } from 'ionicons/icons';
import { EventService } from '../services/event.service';
import { Event } from '../interfaces/event.interface';
import { environment } from '../../environments/environment';
import { PushNotificationService } from '../services/push-notification.service';

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
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonAvatar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    RouterModule
  ],
})
export class HomePage implements OnInit {
  events: Event[] = [];
  isLoading = false;
  page = 1;
  limit = 10;
  totalPages = 0;
  searchTerm = '';
  showNotificationButton = false;

  constructor(
    private eventService: EventService,
    private pushNotificationService: PushNotificationService
  ) {
    addIcons({ 
      calendar, location, time, people, search, filter, 
      'calendar-outline': calendarOutline, 
      'location-outline': locationOutline, 
      'time-outline': timeOutline, 
      'people-outline': peopleOutline,
      'image-outline': imageOutline,
      'notifications-outline': notificationsOutline
    });
  }

  ngOnInit() {
    this.loadEvents();
    this.checkNotificationPermission();
  }

  checkNotificationPermission() {
    if ('Notification' in window) {
      this.showNotificationButton = Notification.permission === 'default';
    }
  }

  async activarNotificaciones() {
    await this.pushNotificationService.inicializarNotificaciones();
    this.checkNotificationPermission();
  }

  loadEvents(event?: any, isRefresh = false) {
    if (isRefresh) {
      this.page = 1;
      this.events = [];
    }

    this.isLoading = true;

    this.eventService.getAllEvents(this.page, this.limit, 'ACTIVE', true, this.searchTerm).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newEvents = response.data.events;
          this.totalPages = response.data.pagination.pages;
          
          if (isRefresh) {
            this.events = newEvents;
          } else {
            this.events = [...this.events, ...newEvents];
          }
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (error) => {
        console.error('Error loading events', error);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  handleSearch(event: any) {
    this.searchTerm = event.detail.value;
    this.loadEvents(null, true);
  }

  loadMore(event: any) {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadEvents(event);
    } else {
      event.target.disabled = true;
    }
  }

  handleRefresh(event: any) {
    this.loadEvents(event, true);
  }

  getEventImageUrl(event: Event): string | undefined {
    if (event.photos && event.photos.length > 0) {
      const photoUrl = event.photos[0].url;
      if (photoUrl.startsWith('http')) return photoUrl;
      
      const baseUrl = environment.apiUrl.replace('/api', '');
      const cleanPath = photoUrl.replace(/\\/g, '/');
      return `${baseUrl}/${cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath}`;
    }
    return undefined;
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
    event.target.parentElement.classList.add('no-image');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
