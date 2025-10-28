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
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { LoginRequest, VerifyCodeRequest } from '../interfaces/auth.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    ReactiveFormsModule,
    CommonModule
  ],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  verificationForm: FormGroup;
  isLoading = false;
  showVerification = false;
  userEmail = '';
  resendTimer = 0;
  resendInterval: any;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.loginForm = this.createLoginForm();
    this.verificationForm = this.createVerificationForm();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private createVerificationForm(): FormGroup {
    return this.formBuilder.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const credentials: LoginRequest = this.loginForm.value;
      
      try {
        const response = await this.authService.login(credentials).toPromise();
        
        if (response?.success) {
          this.userEmail = credentials.email;
          this.showVerification = true;
          this.startResendTimer();
          await this.showVerificationToast();
        }
      } catch (error: any) {
        await this.handleLoginError(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.showValidationErrors();
    }
  }

  async onVerifyCode() {
    if (this.verificationForm.valid) {
      this.isLoading = true;
      
      const verifyData: VerifyCodeRequest = {
        email: this.userEmail,
        code: this.verificationForm.value.code
      };
      
      try {
        const response = await this.authService.verifyCode(verifyData).toPromise();
        
        if (response?.success) {
          await this.showSuccessToast();
          this.router.navigate(['/home']);
        }
      } catch (error: any) {
        await this.handleVerificationError(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.showValidationErrors();
    }
  }

  async resendCode() {
    if (this.resendTimer > 0) return;
    
    this.isLoading = true;
    
    try {
      const response = await this.authService.resendCode(this.userEmail).toPromise();
      
      if (response?.success) {
        this.startResendTimer();
        await this.showResendSuccessToast();
      }
    } catch (error: any) {
      await this.handleResendError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private startResendTimer() {
    this.resendTimer = 240; // 4 minutos
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  goBackToLogin() {
    this.showVerification = false;
    this.verificationForm.reset();
    this.resendTimer = 0;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  private async showSuccessToast() {
    const toast = await this.toastController.create({
      message: '¡Bienvenido de vuelta!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showVerificationToast() {
    const toast = await this.toastController.create({
      message: 'Código de verificación enviado a tu correo electrónico',
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showResendSuccessToast() {
    const toast = await this.toastController.create({
      message: 'Nuevo código de verificación enviado',
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async handleLoginError(error: any) {
    console.error('Error completo en login:', error); // Para debug
    
    let message = 'Ha ocurrido un error al iniciar sesión';
    
    // Verificar si hay errores de validación
    if (error.error && error.error.errors && error.error.errors.length > 0) {
      const validationErrors = error.error.errors;
      message = 'Por favor, corrige los siguientes errores:\n\n';
      validationErrors.forEach((err: any) => {
        message += `• ${err.msg}\n`;
      });
    } 
    // Verificar si hay un mensaje específico del servidor
    else if (error.error && error.error.message) {
      message = error.error.message;
    }
    // Verificar el status code para casos específicos
    else if (error.status === 401) {
      message = 'Email o contraseña incorrectos';
    }
    else if (error.status === 403) {
      message = 'Tu cuenta no ha sido activada. Por favor, revisa tu correo electrónico.';
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

  private async handleVerificationError(error: any) {
    console.error('Error completo en verificación:', error);
    
    let message = 'Ha ocurrido un error al verificar el código';
    
    if (error.error && error.error.message) {
      message = error.error.message;
    } else if (error.error && error.error.errors && error.error.errors.length > 0) {
      const validationErrors = error.error.errors;
      message = 'Por favor, corrige los siguientes errores:\n\n';
      validationErrors.forEach((err: any) => {
        message += `• ${err.msg}\n`;
      });
    }

    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async handleResendError(error: any) {
    console.error('Error completo en reenvío:', error);
    
    let message = 'Ha ocurrido un error al reenviar el código';
    
    if (error.error && error.error.message) {
      message = error.error.message;
    } else if (error.error && error.error.errors && error.error.errors.length > 0) {
      const validationErrors = error.error.errors;
      message = 'Por favor, corrige los siguientes errores:\n\n';
      validationErrors.forEach((err: any) => {
        message += `• ${err.msg}\n`;
      });
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

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Getters para acceder fácilmente a los controles del formulario
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get code() { return this.verificationForm.get('code'); }

  // Método para formatear el tiempo de reenvío
  get formattedResendTime(): string {
    const minutes = Math.floor(this.resendTimer / 60);
    const seconds = this.resendTimer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
