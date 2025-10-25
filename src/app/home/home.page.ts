import { Component } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle,
  IonButton,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    RouterModule
  ],
})
export class HomePage {
  constructor() {}
}
