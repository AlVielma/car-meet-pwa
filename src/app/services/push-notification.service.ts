import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`; 

  constructor(
    private http: HttpClient,
    private swPush: SwPush,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    this.escucharNotificaciones();
  }

  private escucharNotificaciones() {
    if (this.swPush.isEnabled) {
      this.swPush.messages.subscribe((message: any) => {
        console.log('📩 Notificación recibida en primer plano:', message);
        this.mostrarToast(message);
      });

      this.swPush.notificationClicks.subscribe(({ action, notification }) => {
        console.log('👆 Click en notificación:', { action, notification });
        if (notification.data && notification.data.url) {
          window.location.href = notification.data.url;
        }
      });
    }
  }

  private async mostrarToast(message: any) {
    // Angular SW envía el payload dentro de 'notification' si viene formateado así,
    // o directamente en el objeto si es data pura. Adaptamos según llegue.
    const title = message.notification?.title || message.title || 'Nueva notificación';
    const body = message.notification?.body || message.body || '';

    const toast = await this.toastController.create({
      header: title,
      message: body,
      duration: 5000,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Ver',
          handler: () => {
            // Si viene url en data
            const url = message.notification?.data?.url || message.data?.url;
            if (url) {
              // Navegar internamente si es posible, o window.location
              window.location.href = url;
            }
          }
        },
        {
          role: 'cancel',
          text: 'Cerrar'
        }
      ]
    });
    await toast.present();
  }

  async inicializarNotificaciones() {
    console.log('🔔 Iniciando configuración de notificaciones...');

    // 1. Verificar si el navegador/dispositivo soporta notificaciones
    if (!this.swPush.isEnabled) {
      console.warn('⚠️ Push notifications no soportadas o Service Worker no habilitado.');
      console.warn('Asegúrate de estar en HTTPS o localhost y que el SW esté registrado.');
      return;
    }

    try {
      // 2. Obtener la VAPID Public Key de tu backend
      console.log('🔑 Obteniendo VAPID Key...');
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/vapid-key`)
      );
      
      const publicKey = response.key;
      console.log('🔑 VAPID Key obtenida:', publicKey);

      // 3. Pedir permiso al usuario y obtener el objeto de suscripción del navegador
      console.log('👤 Solicitando permiso al usuario...');
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: publicKey
      });
      console.log('✅ Permiso concedido. Suscripción generada:', subscription);

      // 4. Enviar la suscripción a tu backend para guardarla en la BD
      console.log('📤 Enviando suscripción al backend...');
      await this.enviarSuscripcionAlBackend(subscription);
      
      console.log('✅✅ Notificaciones activadas y guardadas correctamente');

    } catch (error) {
      console.error('❌ Error al activar notificaciones:', error);
    }
  }

  private async enviarSuscripcionAlBackend(subscription: PushSubscription) {
    const token = this.authService.getToken(); 
    
    if (!token) {
      console.warn('No hay token para enviar suscripción');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return firstValueFrom(
      this.http.post(`${this.apiUrl}/subscribe`, subscription, { headers })
    );
  }
}
