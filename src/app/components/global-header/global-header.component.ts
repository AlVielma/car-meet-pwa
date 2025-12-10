import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonChip
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-global-header',
  templateUrl: './global-header.component.html',
  styleUrls: ['./global-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonChip
  ]
})
export class GlobalHeaderComponent {
  @Input() title: string = 'Car Meet';
  @Input() showUpdateStatus: boolean = true;
  @Input() color: string = 'primary';
}
