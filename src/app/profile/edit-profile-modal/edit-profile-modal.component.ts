import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonItem, IonLabel, IonInput, IonAvatar, IonIcon, IonSpinner, ModalController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, close, checkmark, image } from 'ionicons/icons';
import { User } from '../../interfaces/auth.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonLabel, IonInput, IonAvatar, IonIcon, IonSpinner
  ]
})
export class EditProfileModalComponent implements OnInit {
  @Input() user!: User;
  
  profileForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  serverErrors: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private authService: AuthService,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ camera, close, checkmark, image });
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]]
    });
  }

  ngOnInit() {
    if (this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phone: this.user.phone
      });
      this.previewUrl = this.user.profilePhoto || null;
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async presentPhotoOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar foto de perfil',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.triggerCameraInput();
          }
        },
        {
          text: 'Elegir de Galería',
          icon: 'image',
          handler: () => {
            this.triggerFileInput();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    await actionSheet.present();
  }

  triggerFileInput() {
    const fileInput = document.getElementById('editProfileFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  triggerCameraInput() {
    const cameraInput = document.getElementById('editProfileCameraInput') as HTMLInputElement;
    if (cameraInput) cameraInput.click();
  }

  save() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.serverErrors = [];
      
      const formData = new FormData();
      formData.append('firstName', this.profileForm.get('firstName')?.value);
      formData.append('lastName', this.profileForm.get('lastName')?.value);
      formData.append('phone', this.profileForm.get('phone')?.value || '');
      
      if (this.selectedFile) {
        formData.append('photo', this.selectedFile);
      }

      this.authService.updateProfile(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.modalCtrl.dismiss(response.data, 'confirm');
          } else {
            // Handle generic error message
            console.error(response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error && error.error.errors) {
            this.serverErrors = error.error.errors;
          } else {
            console.error('Error updating profile', error);
          }
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }
  
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (control?.errors && (control.dirty || control.touched)) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['pattern']) return 'Formato inválido (10 dígitos)';
    }
    
    // Check server errors
    const serverError = this.serverErrors.find(e => e.path === controlName);
    if (serverError) return serverError.msg;
    
    return '';
  }
}
