import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonIcon,
  IonBadge,
  IonButton,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonFooter,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonToast,
  ModalController,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  locationOutline, 
  timeOutline, 
  peopleOutline, 
  imageOutline,
  shareSocialOutline,
  heartOutline,
  heart,
  addCircleOutline,
  carSportOutline,
  closeOutline,
  arrowBackOutline,
  checkmarkCircle,
  carSport
} from 'ionicons/icons';
import { EventService } from '../../services/event.service';
import { CarService } from '../../services/car.service';
import { Event, Participation } from '../../interfaces/event.interface';
import { Car, CreateCarRequest } from '../../interfaces/car.interface';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CarModalComponent } from '../../garage/car-modal/car-modal.component';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonIcon,
    IonBadge,
    IonButton,
    IonAvatar,
    IonCard,
    IonCardContent,
    IonFooter,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonToast
  ]
})
export class EventDetailsPage implements OnInit {
  event: Event | null = null;
  participation: Participation | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Participation Logic
  isParticipationModalOpen = false;
  myCars: Car[] = [];
  selectedCarId: number | null = null;
  isParticipating = false;
  toastMessage: string | null = null;
  isToastOpen = false;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private carService: CarService,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {
    addIcons({ 
      calendarOutline, 
      locationOutline, 
      timeOutline, 
      peopleOutline, 
      imageOutline,
      shareSocialOutline,
      heartOutline,
      heart,
      addCircleOutline,
      carSportOutline,
      closeOutline,
      arrowBackOutline,
      checkmarkCircle,
      carSport
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(+id);
      this.checkParticipation(+id);
    } else {
      this.error = 'Evento no encontrado';
      this.isLoading = false;
    }
  }

  loadEvent(id: number) {
    this.isLoading = true;
    this.eventService.getEventById(id).subscribe({
      next: (response) => {
        this.event = response.data || null;
        // Only set loading to false if participation check is also done or failed
        // But for simplicity, we can handle loading state in each or combined.
        // Let's keep isLoading true until event is loaded. Participation might load a bit later.
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading event', err);
        this.error = 'Error al cargar el evento';
        this.isLoading = false;
      }
    });
  }

  checkParticipation(eventId: number) {
    this.eventService.getMyParticipations().subscribe({
      next: (response) => {
        const participations = response.data || [];
        this.participation = participations.find(p => p.event.id === eventId) || null;
      },
      error: (err) => {
        console.error('Error checking participation', err);
      }
    });
  }

  async openParticipationModal() {
    this.isLoading = true;
    this.carService.getMyCars().subscribe({
      next: (response) => {
        this.myCars = response.data || [];
        this.isParticipationModalOpen = true;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading cars', err);
        this.showToast('Error al cargar tus autos');
        this.isLoading = false;
      }
    });
  }

  closeParticipationModal() {
    this.isParticipationModalOpen = false;
    this.selectedCarId = null;
  }

  async openCreateCarModal() {
    this.isParticipationModalOpen = false;
    
    const modal = await this.modalCtrl.create({
      component: CarModalComponent
    });

    modal.onWillDismiss().then((result) => {
      if (result.data) {
        this.createCar(result.data);
      } else {
        // If cancelled, re-open participation modal so user doesn't get lost
        this.openParticipationModal();
      }
    });

    await modal.present();
  }

  createCar(carData: any) {
    this.isLoading = true;
    this.carService.createCar(carData).subscribe({
      next: (response) => {
        this.showToast('Auto creado exitosamente');
        this.isLoading = false;
        this.openParticipationModal();
      },
      error: (err) => {
        console.error('Error creating car', err);
        this.showToast('Error al crear el auto');
        this.isLoading = false;
        this.openParticipationModal();
      }
    });
  }

  confirmParticipation() {
    if (!this.selectedCarId || !this.event) return;

    this.isParticipating = true;
    this.eventService.participateInEvent(this.event.id, this.selectedCarId).subscribe({
      next: (response) => {
        this.isParticipating = false;
        this.closeParticipationModal();
        this.showToast('¡Solicitud enviada exitosamente!');
        this.loadEvent(this.event!.id);
        this.checkParticipation(this.event!.id);
      },
      error: (err) => {
        this.isParticipating = false;
        console.error('Error participating', err);
        const message = err.error?.message || 'Error al enviar solicitud';
        this.showToast(message);
      }
    });
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  goBack() {
    this.navCtrl.back();
  }
}
