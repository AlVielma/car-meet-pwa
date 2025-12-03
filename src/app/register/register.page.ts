import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonText,
  IonSpinner,
  AlertController,
  ToastController,
  IonIcon,
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { RegisterRequest } from '../interfaces/auth.interface';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardTitle,
    IonText,
    IonSpinner,
    IonIcon,
    IonAvatar,
    ReactiveFormsModule,
    CommonModule
  ],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.registerForm = this.createForm();
    addIcons({ camera });
  }

  ngOnInit() {}

  private createForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirm = form.get('passwordConfirm');
    
    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      passwordConfirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      try {
        const formData = new FormData();
        const formValue = this.registerForm.value;

        // Agregar campos del formulario
        Object.keys(formValue).forEach(key => {
          if (formValue[key] !== null && formValue[key] !== undefined) {
            formData.append(key, formValue[key]);
          }
        });

        // Agregar foto si existe
        if (this.selectedPhoto) {
          formData.append('photo', this.selectedPhoto);
        }

        const response = await this.authService.register(formData).toPromise();
        
        if (response?.success) {
          await this.showSuccessAlert();
          this.router.navigate(['/login']);
        }
      } catch (error: any) {
        await this.handleRegistrationError(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.showValidationErrors();
    }
  }

  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: '¡Registro Exitoso!',
      message: 'Tu cuenta ha sido creada exitosamente. Por favor, revisa tu correo para activar tu cuenta.',
      buttons: ['OK']
    });
    await alert.present();
  }

  private async handleRegistrationError(error: any) {
    console.error('Error completo:', error);
    
    let message = 'Ha ocurrido un error al registrar tu cuenta';
    
    if (error.error && error.error.errors && error.error.errors.length > 0) {
      const validationErrors = error.error.errors;
      message = 'Por favor, corrige los siguientes errores:\n\n';
      validationErrors.forEach((err: any) => {
        message += `• ${err.msg}\n`;
      });
    } 
    else if (error.error && error.error.message) {
      message = error.error.message;
    }
    else if (error.status === 409) {
      message = 'El email ya está registrado. Por favor, usa otro email o inicia sesión.';
    }
    else if (error.status === 422) {
      message = 'Los datos enviados no son válidos. Por favor, revisa la información.';
    }
    else if (error.status === 500) {
      message = 'Error interno del servidor. Por favor, intenta más tarde.';
    }

    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async showValidationErrors() {
    const toast = await this.toastController.create({
      message: 'Por favor, completa todos los campos correctamente',
      duration: 3000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get passwordConfirm() { return this.registerForm.get('passwordConfirm'); }
}
