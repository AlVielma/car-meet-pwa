import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any;
  public showInstallPromotion$ = new BehaviorSubject<boolean>(false);
  public isIOS: boolean = false;

  constructor(private platform: Platform) {
    this.checkPlatform();
    this.initPwaPrompt();
  }

  private checkPlatform() {
    this.isIOS = this.platform.is('ios') || this.platform.is('ipad') || this.platform.is('iphone');
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (this.isIOS && !isStandalone) {
      // On iOS we can't programmatically trigger install, but we can show the button to open instructions
      this.showInstallPromotion$.next(true);
    }
  }

  private initPwaPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      this.showInstallPromotion$.next(true);
      console.log('beforeinstallprompt fired');
    });

    window.addEventListener('appinstalled', () => {
      // Hide the app-provided install promotion
      this.showInstallPromotion$.next(false);
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });
  }

  public async installPwa() {
    if (this.isIOS) {
      // Show iOS installation instructions
      return 'ios';
    }

    if (!this.deferredPrompt) {
      return null;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    
    // Hide the install button
    if (outcome === 'accepted') {
      this.showInstallPromotion$.next(false);
    }
    
    return outcome;
  }
}
