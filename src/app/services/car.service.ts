import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/auth.interface';
import { Car, CreateCarRequest, UpdateCarRequest } from '../interfaces/car.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMyCars(): Observable<ApiResponse<Car[]>> {
    return this.http.get<ApiResponse<Car[]>>(`${this.API_URL}/cars/my-cars`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createCar(carData: CreateCarRequest): Observable<ApiResponse<Car>> {
    const formData = new FormData();
    formData.append('brand', carData.brand);
    formData.append('model', carData.model);
    formData.append('year', carData.year.toString());
    formData.append('color', carData.color);
    
    if (carData.licensePlate) formData.append('licensePlate', carData.licensePlate);
    if (carData.description) formData.append('description', carData.description);
    if (carData.modifications) formData.append('modifications', carData.modifications);
    if (carData.photo) formData.append('image', carData.photo);

    return this.http.post<ApiResponse<Car>>(`${this.API_URL}/cars`, formData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateCar(carData: UpdateCarRequest): Observable<ApiResponse<Car>> {
    const formData = new FormData();
    if (carData.brand) formData.append('brand', carData.brand);
    if (carData.model) formData.append('model', carData.model);
    if (carData.year) formData.append('year', carData.year.toString());
    if (carData.color) formData.append('color', carData.color);
    if (carData.licensePlate) formData.append('licensePlate', carData.licensePlate);
    if (carData.description) formData.append('description', carData.description);
    if (carData.modifications) formData.append('modifications', carData.modifications);
    if (carData.photo) formData.append('image', carData.photo);

    return this.http.put<ApiResponse<Car>>(`${this.API_URL}/cars/${carData.id}`, formData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en CarService:', error);
    return throwError(() => error);
  }
}
