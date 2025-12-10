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
  IonAvatar,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, image, close } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { RegisterRequest } from '../interfaces/auth.interface';

declare global {
  interface Window { grecaptcha: any; }
}

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
  private recaptchaWidgetId: number | null = null;
  private recaptchaLoaded = false;
  // Put your site key here (updated)
  private readonly RECAPTCHA_SITE_KEY = '6LfNlCUsAAAAAGSUWSqila-_Wmc2n0hBsy2KYiV3';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    this.registerForm = this.createForm();
    addIcons({ camera, image, close });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.loadReCaptchaScript();
  }

  private loadReCaptchaScript() {
    // If already present, try to render
    if (window.grecaptcha) {
      this.recaptchaLoaded = true;
      this.renderReCaptcha();
      return;
    }

    // Insert script
    const scriptId = 'recaptcha-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.recaptchaLoaded = true;
      this.renderReCaptcha();
    };
    script.onerror = (e) => console.error('Error loading reCAPTCHA script', e);
    document.head.appendChild(script);
  }

  private renderReCaptcha() {
    try {
      if (!window.grecaptcha) return;
      // Ensure container exists
      const container = document.getElementById('recaptcha-container');
      if (!container) return;

      // If already rendered, reset
      try {
        if (this.recaptchaWidgetId !== null) {
          window.grecaptcha.reset(this.recaptchaWidgetId);
        }
      } catch (e) { }

      // Render checkbox widget. Use grecaptcha.ready if available to ensure API is initialized.
      const doRender = () => {
        try {
          if (typeof window.grecaptcha.render === 'function') {
            this.recaptchaWidgetId = window.grecaptcha.render(container, {
              sitekey: this.RECAPTCHA_SITE_KEY,
              theme: 'light'
            });
          } else {
            // Not yet available; throw to trigger retry below
            throw new Error('grecaptcha.render not available');
          }
        } catch (err) {
          // Retry a few times with delay
          let attempts = 0;
          const maxAttempts = 5;
          const retry = () => {
            attempts++;
            if (attempts > maxAttempts) {
              console.error('Failed to render reCAPTCHA after retries', err);
              return;
            }
            if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
              try {
                this.recaptchaWidgetId = window.grecaptcha.render(container, {
                  sitekey: this.RECAPTCHA_SITE_KEY,
                  theme: 'light'
                });
              } catch (e) {
                setTimeout(retry, 500);
              }
            } else {
              setTimeout(retry, 500);
            }
          };
          setTimeout(retry, 300);
        }
      };

      if (typeof window.grecaptcha.ready === 'function') {
        window.grecaptcha.ready(() => doRender());
      } else {
        // If ready isn't available, attempt immediate render (or retries inside doRender)
        doRender();
      }
    } catch (e) {
      console.error('Error rendering reCAPTCHA', e);
    }
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, this.passwordValidator]],
      passwordConfirm: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordValidator(control: any) {
    const value = control.value;
    if (!value) {
      return null; // El required validator maneja esto
    }

    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&.#_\-]/.test(value);

    const passwordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (!passwordValid) {
      return {
        passwordStrength: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecialChar
        }
      };
    }

    return null;
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
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  triggerCameraInput() {
    const cameraInput = document.getElementById('cameraInput') as HTMLInputElement;
    if (cameraInput) cameraInput.click();
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      try {
        // Obtener token reCAPTCHA (v2 checkbox)
        let recaptchaToken = '';
        try {
          if (this.recaptchaLoaded && this.recaptchaWidgetId !== null && window.grecaptcha) {
            recaptchaToken = window.grecaptcha.getResponse(this.recaptchaWidgetId);
          }
        } catch (e) {
          console.warn('Error obtaining recaptcha token', e);
        }

        if (!recaptchaToken) {
          this.isLoading = false;
          const toast = await this.toastController.create({
            message: 'Por favor completa el reCAPTCHA antes de continuar.',
            duration: 3000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          return;
        }
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

        // Agregar token reCAPTCHA
        formData.append('g-recaptcha-response', recaptchaToken);

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
