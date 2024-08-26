import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MessageLoadingService {
  private isLoadingSource$ = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSource$.asObservable();

  setLoading(value) {
    this.isLoadingSource$.next(value);
  }
}
