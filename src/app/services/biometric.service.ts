import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private readonly CREDENTIAL_KEY = 'user_biometric_credential_id';
  private isUnlockedSubject = new BehaviorSubject<boolean>(false);
  
  public isUnlocked$ = this.isUnlockedSubject.asObservable();

  constructor() { }

  setUnlocked(value: boolean) {
    this.isUnlockedSubject.next(value);
  }

  get isUnlocked(): boolean {
    return this.isUnlockedSubject.value;
  }

  // Verifica si el dispositivo soporta biometría (WebAuthn)
  async isAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }
    
    // Verifica si hay un autenticador de plataforma (Huella, FaceID, Windows Hello)
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      console.error('Error checking biometric availability', e);
      return false;
    }
  }

  // Intenta autenticar o registrar al usuario usando biometría
  async verifyUser(): Promise<boolean> {
    try {
      // Intentamos recuperar una credencial existente (Autenticación)
      const credentialId = localStorage.getItem(this.CREDENTIAL_KEY);
      
      if (credentialId) {
        return await this.authenticate(credentialId);
      } else {
        // Si no hay credencial previa, registramos una nueva (Registro)
        return await this.register();
      }
    } catch (error) {
      console.error('Biometric verification failed', error);
      return false;
    }
  }

  private async register(): Promise<boolean> {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: 'Car Meet PWA',
        },
        user: {
          id: new Uint8Array(16),
          name: 'usuario@carmeet.com',
          displayName: 'Usuario Car Meet'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Fuerza usar el lector del dispositivo
          userVerification: 'required' // Obliga a poner el dedo/cara
        },
        timeout: 60000,
        attestation: 'direct'
      };

      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
      
      if (credential) {
        // Guardamos el ID para futuras autenticaciones
        localStorage.setItem(this.CREDENTIAL_KEY, credential.id);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error registering biometric', e);
      // Si falla el registro, intentamos limpiar y retornar falso
      return false;
    }
  }

  private async authenticate(credentialId: string): Promise<boolean> {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        timeout: 60000,
        userVerification: 'required', // Obliga a poner el dedo/cara
        // En una implementación real, aquí pasaríamos el ID de la credencial guardada
        // Pero para "simular" el gate sin backend complejo, a veces es mejor dejar allowCredentials vacío 
        // o manejarlo genéricamente. Para este caso, intentaremos una autenticación genérica.
      };

      // Nota: Sin un backend real que valide la firma, esto es una validación "UI"
      // El navegador pedirá la huella. Si el usuario la pone mal, el navegador lanza error.
      // Si la pone bien, el navegador devuelve la credencial.
      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
      
      return !!assertion;
    } catch (e) {
      // Si falla la autenticación (ej: credencial no encontrada), intentamos registrar de nuevo
      // Esto ayuda si el usuario borró sus datos
      console.log('Authentication failed, trying registration fallback');
      return this.register();
    }
  }
}
