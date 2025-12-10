import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class NetworkService {
    private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
    public isOnline$: Observable<boolean> = this.onlineSubject.asObservable();

    constructor() {
        // Listen to online/offline events
        merge(
            fromEvent(window, 'online').pipe(map(() => true)),
            fromEvent(window, 'offline').pipe(map(() => false))
        ).subscribe(status => {
            console.log('Network status changed:', status ? 'online' : 'offline');
            this.onlineSubject.next(status);
        });
    }

    get isOnline(): boolean {
        return this.onlineSubject.value;
    }

    checkNetworkStatus(): boolean {
        const status = navigator.onLine;
        this.onlineSubject.next(status);
        return status;
    }
}
