import { Injectable } from '@angular/core';
import { BehaviorSubject, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InboxFilterLoadingService {
  constructor() {}

  private _multiLoading$: BehaviorSubject<number> = new BehaviorSubject(0);
  public multiLoading$ = this._multiLoading$.asObservable().pipe(
    map((value: number) => {
      return value > 0;
    })
  );

  onMultiLoading() {
    this._multiLoading$.next(this._multiLoading$.getValue() + 1);
  }

  offMultiLoading() {
    this._multiLoading$.next(
      this._multiLoading$.getValue() == 0
        ? 0
        : this._multiLoading$.getValue() - 1
    );
  }
}
