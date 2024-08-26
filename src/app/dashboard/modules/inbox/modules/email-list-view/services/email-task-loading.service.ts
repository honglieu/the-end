import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailTaskLoadingService {
  private isLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);

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
    this.isLoading.next(false);
  }
}
