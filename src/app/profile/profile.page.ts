import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons,
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
  IonCol,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  person, settings, notifications, logOut, shield, star, calendar, car, camera, helpCircle,
  logOutOutline, carSportOutline, calendarOutline, cameraOutline, personOutline, 
  shieldCheckmarkOutline, notificationsOutline, helpCircleOutline, alertCircleOutline 
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/auth.interface';
import { EditProfileModalComponent } from './edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons,
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
    IonCol,
    IonSpinner
  ],
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalCtrl: ModalController
  ) {
    addIcons({ 
      person, settings, notifications, logOut, shield, star, calendar, car, camera, helpCircle,
      'log-out-outline': logOutOutline,
      'car-sport-outline': carSportOutline,
      'calendar-outline': calendarOutline,
      'camera-outline': cameraOutline,
      'person-outline': personOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'notifications-outline': notificationsOutline,
      'help-circle-outline': helpCircleOutline,
      'alert-circle-outline': alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  loadUserData() {
    this.isLoading = true;
    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user data', error);
        this.isLoading = false;
      }
    });
  }

  async editProfile() {
    if (!this.user) return;

    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
      componentProps: {
        user: this.user
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.user = data;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
