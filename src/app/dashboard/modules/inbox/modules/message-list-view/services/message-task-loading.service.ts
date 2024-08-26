import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageTaskLoadingService {
  private isLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private isLoadingMessage: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  get isLoadingMessage$() {
    return this.isLoadingMessage.asObservable();
  }

  onLoadingMessage() {
    this.isLoadingMessage.next(true);
  }

  stopLoadingMessage() {
    this.isLoadingMessage.next(false);
  }

  get isLoading$() {
    return this.isLoading.asObservable();
  }

  onLoading() {
    this.isLoading.next(true);
  }

  stopLoading() {
    this.isLoading.next(false);
  }

  stopFullLoading() {
    this.isLoadingMessage.next(false);
    this.isLoading.next(false);
  }
}
