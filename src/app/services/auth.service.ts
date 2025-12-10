import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RegisterRequest, LoginRequest, VerifyCodeRequest, ResendCodeRequest, ApiResponse, User, LoginResponse, VerificationCodeResponse } from '../interfaces/auth.interface';
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
  register(userData: RegisterRequest | FormData): Observable<ApiResponse<User>> {
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
  login(credentials: LoginRequest): Observable<ApiResponse<VerificationCodeResponse>> {
    return this.http.post<ApiResponse<VerificationCodeResponse>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Verifica el código de 2 pasos
   */
  verifyCode(verifyData: VerifyCodeRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/verify-code`, verifyData)
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
   * Reenvía el código de verificación
   */
  resendCode(email: string, recaptchaToken?: string): Observable<ApiResponse<VerificationCodeResponse>> {
    const requestData: ResendCodeRequest = { email };
    if (recaptchaToken) {
      // send token using the expected key name
      (requestData as any)['g-recaptcha-response'] = recaptchaToken;
    }
    return this.http.post<ApiResponse<VerificationCodeResponse>>(`${this.API_URL}/auth/resend-code`, requestData)
      .pipe(
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
   * Obtiene la información del usuario actual desde el servidor
   */
  getMe(): Observable<ApiResponse<User>> {
    const token = this.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Actualizar usuario en localStorage y subject
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(data: FormData): Observable<ApiResponse<User>> {
    const token = this.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/auth/me`, data, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Actualizar usuario en localStorage y subject
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
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
