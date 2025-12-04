import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BiometricService } from '../services/biometric.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BiometricGuard implements CanActivate {
  constructor(
    private biometricService: BiometricService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Si no está autenticado, dejar pasar (el AuthGuard lo atrapará y mandará al login)
    if (!this.authService.isAuthenticated()) {
      return true;
    }

    // Si ya está desbloqueado en esta sesión, permitir acceso
    if (this.biometricService.isUnlocked) {
      return true;
    }

    // Verificar si el dispositivo soporta biometría
    return from(this.biometricService.isAvailable()).pipe(
      map(isAvailable => {
        if (!isAvailable) {
          // Si no hay biometría disponible, marcamos como desbloqueado y dejamos pasar
          this.biometricService.setUnlocked(true);
          return true;
        }
        
        // Si hay biometría y no está desbloqueado, redirigir a la pantalla de bloqueo
        return this.router.createUrlTree(['/biometric-lock']);
      })
    );
  }
}
