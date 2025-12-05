import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/auth.interface';
import { PaginatedEventsResponse, Event, Participation } from '../interfaces/event.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getEventById(id: number): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.API_URL}/events/${id}`);
  }

  participateInEvent(eventId: number, carId?: number, newCarData?: any): Observable<ApiResponse<any>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    
    if (carId) {
      // Opción 1: Usar auto existente
      return this.http.post<ApiResponse<any>>(
        `${this.API_URL}/events/${eventId}/participate`, 
        { carId }, 
        { headers }
      );
    } else if (newCarData) {
      // Opción 2: Crear nuevo auto
      const formData = new FormData();
      formData.append('brand', newCarData.brand);
      formData.append('model', newCarData.model);
      formData.append('year', newCarData.year.toString());
      formData.append('color', newCarData.color);
      
      if (newCarData.licensePlate) formData.append('licensePlate', newCarData.licensePlate);
      if (newCarData.description) formData.append('description', newCarData.description);
      if (newCarData.modifications) formData.append('modifications', newCarData.modifications);
      if (newCarData.photo) formData.append('image', newCarData.photo);

      return this.http.post<ApiResponse<any>>(
        `${this.API_URL}/events/${eventId}/participate`, 
        formData, 
        { headers }
      );
    } else {
      throw new Error('Se requiere carId o datos de nuevo auto');
    }
  }

  getAllEvents(
    page: number = 1, 
    limit: number = 10, 
    status?: string, 
    upcoming: boolean = true,
    search?: string
  ): Observable<ApiResponse<PaginatedEventsResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (upcoming) {
      params = params.set('upcoming', 'true');
    }

    if (search) {
      params = params.set('search', search);
    }

    // No necesitamos header de auth para ver eventos públicos, 
    // pero si el backend lo requiere, descomentar:
    // const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);

    return this.http.get<ApiResponse<PaginatedEventsResponse>>(`${this.API_URL}/events`, { params });
  }

  getMyParticipations(): Observable<ApiResponse<Participation[]>> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    return this.http.get<ApiResponse<Participation[]>>(`${this.API_URL}/events/my-participations`, { headers });
  }
}
