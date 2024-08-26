import { Injectable, NgZone } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

function runInZone<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return (source) => {
    return new Observable((observer) => {
      const onNext = (value: T) => zone.run(() => observer.next(value));
      const onError = (e: any) => zone.run(() => observer.error(e));
      const onComplete = () => zone.run(() => observer.complete());
      return source.subscribe(onNext, onError, onComplete);
    });
  };
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastHelperService {
  private broadcastChannel: BroadcastChannel;
  private onMessage = new Subject<any>();

  private broadcastSmsChannel: BroadcastChannel;
  private onMessageSmsChannel = new Subject();

  constructor(private ngZone: NgZone) {
    this.broadcastChannel = new BroadcastChannel('End call');
    this.broadcastChannel.onmessage = (message: any) => {
      this.onMessage.next(message);
    };
    // create new broad cash instance
    this.broadcastSmsChannel = new BroadcastChannel('READ_SUMMARY_SMS');
    this.broadcastSmsChannel.onmessage = (message) => {
      this.onMessageSmsChannel.next(message);
    };
  }

  publish(message: any): void {
    this.broadcastChannel.postMessage(message);
  }

  getMessage(): Observable<any> {
    return this.onMessage.pipe(
      runInZone(this.ngZone),
      map((message: any) => message.data)
    );
  }

  setSmsPublish(data): void {
    this.broadcastSmsChannel.postMessage(data);
  }

  getSmsBroadCashChannel() {
    return this.onMessageSmsChannel.pipe(
      runInZone(this.ngZone),
      map((res: any) => res.data)
    );
  }
}
