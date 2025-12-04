import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService
  ) {}

  ngOnInit() {
    // if (this.authService.isAuthenticated()) {
    //   this.pushNotificationService.inicializarNotificaciones();
    // }
  }
}
