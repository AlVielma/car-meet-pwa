import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { BiometricService } from '../services/biometric.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-biometric-lock',
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <div class="lock-container">
        <div class="icon-container">
          <i class="fas fa-fingerprint lock-icon"></i>
        </div>
        
        <h2 class="ion-text-center">Bloqueo de Seguridad</h2>
        <p class="ion-text-center text-medium">
          Para continuar, verifica tu identidad
        </p>

        <div class="actions">
          <ion-button expand="block" (click)="unlock()" [disabled]="isLoading" class="unlock-btn">
            <span *ngIf="!isLoading">
              <i class="fas fa-unlock me-2"></i> Desbloquear
            </span>
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
          </ion-button>

          <ion-button fill="clear" expand="block" (click)="logout()" color="medium">
            Cerrar Sesión
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .lock-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    .icon-container {
      width: 120px;
      height: 120px;
      background: var(--ion-color-light);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .lock-icon {
      font-size: 64px;
      color: var(--ion-color-primary);
    }

    h2 {
      font-weight: 700;
      color: var(--ion-color-dark);
      margin-bottom: 0.5rem;
    }

    .text-medium {
      color: var(--ion-color-medium);
      margin-bottom: 3rem;
    }

    .actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .unlock-btn {
      --border-radius: 12px;
      height: 50px;
      font-weight: 600;
    }

    .me-2 {
      margin-right: 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonIcon,
    IonText,
    IonSpinner
  ]
})
export class BiometricLockPage implements OnInit {
  isLoading = false;

  constructor(
    private biometricService: BiometricService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Intentar desbloquear automáticamente al entrar
    setTimeout(() => {
      this.unlock();
    }, 500);
  }

  async unlock() {
    this.isLoading = true;
    try {
      const verified = await this.biometricService.verifyUser();
      if (verified) {
        this.biometricService.setUnlocked(true);
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Error unlocking', error);
    } finally {
      this.isLoading = false;
    }
  }

  logout() {
    this.authService.logout();
    this.biometricService.setUnlocked(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
