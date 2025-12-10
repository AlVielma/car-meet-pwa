import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';
import { SwUpdate } from '@angular/service-worker';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private swUpdate: SwUpdate,
    private toastController: ToastController,
    private pushNotificationService: PushNotificationService
  ) { }

  ngOnInit() {
    // Check for app updates (only in production)
    this.checkForUpdates();
  }

  private checkForUpdates() {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker updates not enabled (development mode)');
      return;
    }

    // Listen for new versions available
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        console.log('Nueva versión disponible:', event);
        this.showUpdateToast();
      }
    });

    // Check for updates every 30 seconds
    setInterval(() => {
      this.swUpdate.checkForUpdate();
    }, 30000);
  }

  private async showUpdateToast() {
    const toast = await this.toastController.create({
      message: '¡Nueva versión disponible! Actualiza para obtener las últimas mejoras.',
      duration: 0, // No auto-dismiss
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Actualizar',
          role: 'cancel',
          handler: () => {
            window.location.reload();
          }
        },
        {
          text: 'Después',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
