import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  public isLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isLoading$ = this.isLoading.asObservable();
  public isReLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public multiLoading: BehaviorSubject<number> = new BehaviorSubject(0);
  public multiLoading$ = this.multiLoading.asObservable().pipe(
    map((value: number) => {
      return value > 0;
    })
  );

  constructor() {}

  onMultiLoading() {
    this.multiLoading.next(this.multiLoading.getValue() + 1);
  }

  offMultiLoading() {
    this.multiLoading.next(
      this.multiLoading.getValue() == 0 ? 0 : this.multiLoading.getValue() - 1
    );
  }

  onLoading() {
    this.isLoading.next(true);
  }

  onReLoading() {
    this.isReLoading.next(true);
  }

  stopLoading() {
    this.isReLoading.next(false);
    this.isLoading.next(false);
  }
}
