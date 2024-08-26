import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedWorkerService {
  private sharedWorker: SharedWorker;
  private messageSubject: Subject<any> = new Subject<any>();

  constructor() {
    this.sharedWorker = new SharedWorker(
      new URL('./app.shared.worker', import.meta.url)
    );
    this.sharedWorker.port.onmessage = ({ data }) => {
      this.messageSubject.next(data);
    };
    this.sharedWorker.port.onmessageerror = (error) => {
      console.error('Error message received from shared worker:', error);
    };
  }

  get messages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  postMessageToSharedWorker(message: any) {
    this.sharedWorker.port.postMessage(message);
  }
}
