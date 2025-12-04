import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonTextarea,
  IonButton, 
  IonButtons,
  IonIcon,
  ModalController,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { Car } from '../../interfaces/car.interface';

@Component({
  selector: 'app-car-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ car ? 'Editar Auto' : 'Nuevo Auto' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="carForm" (ngSubmit)="onSubmit()">
        
        <!-- Foto Principal -->
        <div class="photo-upload-container" (click)="fileInput.click()">
          <div class="photo-preview" *ngIf="photoPreview || (car && car.photos && car.photos.length > 0)">
            <img [src]="photoPreview || (car?.photos?.[0]?.url)" alt="Car preview">
            <div class="overlay">
              <ion-icon name="camera"></ion-icon>
              <span>Cambiar Foto</span>
            </div>
          </div>
          <div class="photo-placeholder" *ngIf="!photoPreview && (!car || !car.photos || car.photos.length === 0)">
            <ion-icon name="camera-outline"></ion-icon>
            <span>Agregar Foto Principal</span>
            <small>(Recomendado: Horizontal)</small>
          </div>
          <input 
            #fileInput
            type="file" 
            (change)="onFileSelected($event)" 
            accept="image/*" 
            style="display: none;">
        </div>

        <ion-item>
          <ion-label position="stacked">Marca *</ion-label>
          <ion-input formControlName="brand" placeholder="Ej. Toyota"></ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="brand?.invalid && brand?.touched">
          <small *ngIf="brand?.errors?.['required']">La marca es requerida</small>
        </ion-text>

        <ion-item>
          <ion-label position="stacked">Modelo *</ion-label>
          <ion-input formControlName="model" placeholder="Ej. Supra"></ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="model?.invalid && model?.touched">
          <small *ngIf="model?.errors?.['required']">El modelo es requerido</small>
        </ion-text>

        <ion-item>
          <ion-label position="stacked">Año *</ion-label>
          <ion-input type="number" formControlName="year" placeholder="Ej. 1998"></ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="year?.invalid && year?.touched">
          <small *ngIf="year?.errors?.['required']">El año es requerido</small>
        </ion-text>

        <ion-item>
          <ion-label position="stacked">Color *</ion-label>
          <ion-input formControlName="color" placeholder="Ej. Negro"></ion-input>
        </ion-item>
        <ion-text color="danger" *ngIf="color?.invalid && color?.touched">
          <small *ngIf="color?.errors?.['required']">El color es requerido</small>
        </ion-text>

        <ion-item>
          <ion-label position="stacked">Placa</ion-label>
          <ion-input formControlName="licensePlate" placeholder="Ej. ABC-123"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Descripción</ion-label>
          <ion-textarea formControlName="description" rows="3" placeholder="Breve descripción..."></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Modificaciones</ion-label>
          <ion-textarea formControlName="modifications" rows="3" placeholder="Lista de modificaciones..."></ion-textarea>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" [disabled]="carForm.invalid || isLoading">
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            <span *ngIf="!isLoading">{{ car ? 'Actualizar' : 'Crear' }}</span>
          </ion-button>
        </div>

      </form>
    </ion-content>
  `,
  styles: [`
    .photo-upload-container {
      width: 100%;
      height: 250px; /* Más alto para formato horizontal */
      background-color: #f4f5f8;
      border: 2px dashed #dedede;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .photo-preview {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.5);
      color: white;
      padding: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #666;
      gap: 10px;
    }

    .photo-placeholder ion-icon {
      font-size: 48px;
      color: var(--ion-color-primary);
    }

    .photo-placeholder span {
      font-weight: 500;
      font-size: 16px;
    }
    
    .photo-placeholder small {
      color: #999;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonTextarea,
    IonButton, 
    IonButtons,
    IonIcon,
    IonSpinner,
    IonText
  ]
})
export class CarModalComponent implements OnInit {
  @Input() car: Car | null = null;
  carForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.carForm = this.fb.group({
      brand: ['', [Validators.required, Validators.minLength(2)]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900)]],
      color: ['', [Validators.required]],
      licensePlate: [''],
      description: [''],
      modifications: ['']
    });
  }

  ngOnInit() {
    if (this.car) {
      this.carForm.patchValue({
        brand: this.car.brand,
        model: this.car.model,
        year: this.car.year,
        color: this.car.color,
        licensePlate: this.car.licensePlate,
        description: this.car.description,
        modifications: this.car.modifications
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  onSubmit() {
    if (this.carForm.valid) {
      this.modalCtrl.dismiss({
        ...this.carForm.value,
        photo: this.selectedFile
      });
    }
  }

  get brand() { return this.carForm.get('brand'); }
  get model() { return this.carForm.get('model'); }
  get year() { return this.carForm.get('year'); }
  get color() { return this.carForm.get('color'); }
}
