import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RegisterRequest, LoginRequest, ApiResponse, User, LoginResponse } from '../interfaces/auth.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  /**
   * Registra un nuevo usuario
   */
  register(userData: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Guardar usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Guardar usuario y token en localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('tokenExpiry', (Date.now() + response.data.expiresIn * 1000).toString());
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    return user !== null && token !== null && !this.isTokenExpired();
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry);
    return Date.now() >= expiryTime;
  }

  /**
   * Maneja errores de la API
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en AuthService:', error); // Para debug
    
    // Mantener la estructura completa del error para que el componente pueda acceder a ella
    return throwError(() => error);
  }
}
