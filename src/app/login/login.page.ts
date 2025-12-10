import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonButtons,
  IonIcon,
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
import { PwaInstallService } from '../services/pwa-install.service';
import { BiometricService } from '../services/biometric.service';
import { PushNotificationService } from '../services/push-notification.service';
import { LoginRequest, VerifyCodeRequest } from '../interfaces/auth.interface';

declare global {
  interface Window { grecaptcha: any; }
}

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
    IonButtons,
    IonIcon,
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
  showInstallButton = false;
  private recaptchaWidgetIdLogin: number | null = null;
  private recaptchaWidgetIdVerification: number | null = null;
  private recaptchaLoaded = false;
  private currentRecaptchaAction: 'verify' | 'resend' = 'verify';
  private readonly RECAPTCHA_SITE_KEY = '6LfNlCUsAAAAAGSUWSqila-_Wmc2n0hBsy2KYiV3';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private pwaInstallService: PwaInstallService,
    private biometricService: BiometricService,
    private pushNotificationService: PushNotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.loginForm = this.createLoginForm();
    this.verificationForm = this.createVerificationForm();
  }

  ngOnInit() {
    this.pwaInstallService.showInstallPromotion$.subscribe(show => {
      this.showInstallButton = show;
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }

    // Verificar si hay mensajes de activación de cuenta
    this.route.queryParams.subscribe(params => {
      if (params['status'] && params['message']) {
        this.showActivationMessage(params['status'], params['message']);
      }
    });
  }

  ngAfterViewInit() {
    this.loadReCaptchaScript();
  }

  private loadReCaptchaScript() {
    if (window.grecaptcha) {
      this.recaptchaLoaded = true;
      this.renderReCaptchaAll();
      return;
    }

    const scriptId = 'recaptcha-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.recaptchaLoaded = true;
      this.renderReCaptchaAll();
    };
    script.onerror = (e) => console.error('Error loading reCAPTCHA script', e);
    document.head.appendChild(script);
  }

  private renderReCaptchaAll() {
    this.renderReCaptcha('recaptcha-container-login', 'login');
    this.renderReCaptcha('recaptcha-container-verification', 'verification');
  }

  private renderReCaptcha(containerId: string, which: 'login'|'verification') {
    try {
      if (!window.grecaptcha) return;
      const container = document.getElementById(containerId);
      if (!container) return;

      const doRender = () => {
        try {
          if (typeof window.grecaptcha.render === 'function') {
            const widgetId = window.grecaptcha.render(container, {
              sitekey: this.RECAPTCHA_SITE_KEY,
              theme: 'light'
            });
            if (which === 'login') this.recaptchaWidgetIdLogin = widgetId;
            else if (which === 'verification') this.recaptchaWidgetIdVerification = widgetId;
          } else {
            throw new Error('grecaptcha.render not available');
          }
        } catch (err) {
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
                const widgetId = window.grecaptcha.render(container, {
                  sitekey: this.RECAPTCHA_SITE_KEY,
                  theme: 'light'
                });
                if (which === 'login') this.recaptchaWidgetIdLogin = widgetId;
                else if (which === 'verification') this.recaptchaWidgetIdVerification = widgetId;
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
        doRender();
      }
    } catch (e) {
      console.error('Error rendering reCAPTCHA', e);
    }
  }

  private resetRecaptchaForAction(action: 'verify' | 'resend') {
    if (this.recaptchaWidgetIdVerification !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(this.recaptchaWidgetIdVerification);
      } catch (e) {
        console.warn('Error resetting recaptcha', e);
      }
    }
    this.currentRecaptchaAction = action;
  }

  private async showActivationMessage(status: string, message: string) {
    const toast = await this.toastController.create({
      message: decodeURIComponent(message),
      duration: 5000,
      color: status === 'success' ? 'success' : 'danger',
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
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
      
      // Obtén token reCAPTCHA antes de enviar
      let recaptchaToken = '';
      try {
        if (this.recaptchaLoaded && this.recaptchaWidgetIdLogin !== null && window.grecaptcha) {
          recaptchaToken = window.grecaptcha.getResponse(this.recaptchaWidgetIdLogin);
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

      const credentials: LoginRequest = this.loginForm.value;
      // append token to payload using expected key
      (credentials as any)['g-recaptcha-response'] = recaptchaToken;
      
      try {
        const response = await this.authService.login(credentials).toPromise();
        
        if (response?.success) {
          this.userEmail = credentials.email;
          this.showVerification = true;
          this.startResendTimer();
          await this.showVerificationToast();
          // Ensure reCAPTCHA for verification is rendered now that verification view is visible
          setTimeout(() => {
            try {
              this.renderReCaptcha('recaptcha-container-verification', 'verification');
              this.resetRecaptchaForAction('verify');
            } catch (e) {
              console.warn('Error rendering verification reCAPTCHA after showing verification view', e);
            }
          }, 250);
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
      
      // Verificar que el reCAPTCHA esté en modo verify
      if (this.currentRecaptchaAction !== 'verify') {
        this.resetRecaptchaForAction('verify');
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'Por favor completa el reCAPTCHA antes de verificar el código.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
        return;
      }
      
      // Obtener token reCAPTCHA para verificación
      let recaptchaToken = '';
      try {
        if (this.recaptchaLoaded && this.recaptchaWidgetIdVerification !== null && window.grecaptcha) {
          recaptchaToken = window.grecaptcha.getResponse(this.recaptchaWidgetIdVerification);
        }
      } catch (e) {
        console.warn('Error obtaining recaptcha token for verify', e);
      }

      if (!recaptchaToken) {
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'Por favor completa el reCAPTCHA antes de verificar el código.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
        return;
      }

      const verifyData: VerifyCodeRequest = {
        email: this.userEmail,
        code: this.verificationForm.value.code,
        'g-recaptcha-response': recaptchaToken
      };
      
      try {
        const response = await this.authService.verifyCode(verifyData).toPromise();
        
        if (response?.success) {
          await this.showSuccessToast();
          
          // Al hacer login explícito, marcamos como desbloqueado
          this.biometricService.setUnlocked(true);
          
          // Inicializar notificaciones push (MOVIDO AL HOME)
          // this.pushNotificationService.inicializarNotificaciones();

          // Intentar registrar biometría si está disponible y no registrada
          const isBiometricAvailable = await this.biometricService.isAvailable();
          if (isBiometricAvailable) {
             // Opcional: Podríamos forzar un registro aquí silencioso o preguntar
             // Por ahora solo navegamos, el registro se hará cuando se pida desbloquear
             // o podríamos llamar a verifyUser() para asegurar que se registre la credencial
             await this.biometricService.verifyUser(); 
          }

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
      // Cambiar el reCAPTCHA a modo resend
      this.resetRecaptchaForAction('resend');
      
      // Get reCAPTCHA token for resend
      let recaptchaToken = '';
      try {
        if (this.recaptchaLoaded && this.recaptchaWidgetIdVerification !== null && window.grecaptcha) {
          recaptchaToken = window.grecaptcha.getResponse(this.recaptchaWidgetIdVerification);
        }
      } catch (e) {
        console.warn('Error obtaining recaptcha token for resend', e);
      }

      if (!recaptchaToken) {
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: 'Por favor completa el reCAPTCHA antes de reenviar el código.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        await toast.present();
        return;
      }

      const response = await this.authService.resendCode(this.userEmail, recaptchaToken).toPromise();
      
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
    // Resetear el reCAPTCHA de verificación
    this.resetRecaptchaForAction('verify');
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

  async installApp() {
    const outcome = await this.pwaInstallService.installPwa();
    if (outcome === 'ios') {
      const toast = await this.toastController.create({
        message: 'Para instalar en iOS: presiona Compartir y luego "Agregar al inicio"',
        duration: 5000,
        position: 'bottom',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await toast.present();
    }
  }
}
