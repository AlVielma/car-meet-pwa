import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { BiometricGuard } from './guards/biometric.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard, BiometricGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'biometric-lock',
    loadComponent: () => import('./biometric-lock/biometric-lock.page').then( m => m.BiometricLockPage),
    canActivate: [authGuard] // Solo accesible si hay sesión iniciada
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./events/event-details/event-details.component').then( m => m.EventDetailsPage),
    canActivate: [authGuard]
  },
];
