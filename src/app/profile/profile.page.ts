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
  IonAvatar,
  IonList,
  IonToggle,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, settings, notifications, logOut, shield, star, calendar, car, camera, helpCircle } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
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
    IonAvatar,
    IonList,
    IonGrid,
    IonRow,
    IonCol
  ],
})
export class ProfilePage {
  constructor() {
    addIcons({ person, settings, notifications, logOut, shield, star, calendar, car, camera, helpCircle });
  }

  // Datos del usuario
  user = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+1 234 567 8900',
    joinDate: '2024-01-01',
    isActive: true,
    profilePhoto: 'https://via.placeholder.com/150',
    totalEvents: 15,
    totalCars: 2,
    totalVotes: 112,
    totalPhotos: 45
  };



  // Historial de actividad
  recentActivity = [
    {
      id: 1,
      type: 'event',
      title: 'Participaste en Car Meet Downtown',
      date: '2024-01-15',
      icon: 'calendar'
    },
    {
      id: 2,
      type: 'vote',
      title: 'Votaste por Honda Civic Type R',
      date: '2024-01-14',
      icon: 'star'
    },
    {
      id: 3,
      type: 'car',
      title: 'Agregaste Toyota Supra MK4',
      date: '2024-01-10',
      icon: 'car'
    },
    {
      id: 4,
      type: 'photo',
      title: 'Subiste 3 fotos nuevas',
      date: '2024-01-08',
      icon: 'camera'
    }
  ];

  getActivityIcon(type: string): string {
    switch (type) {
      case 'event': return 'calendar';
      case 'vote': return 'star';
      case 'car': return 'car';
      case 'photo': return 'camera';
      default: return 'help-circle';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'event': return 'primary';
      case 'vote': return 'warning';
      case 'car': return 'secondary';
      case 'photo': return 'tertiary';
      default: return 'medium';
    }
  }



  logout() {
    // Implementar lógica de logout
    console.log('Logout clicked');
  }

  editProfile() {
    // Implementar lógica de edición de perfil
    console.log('Edit profile clicked');
  }
}
