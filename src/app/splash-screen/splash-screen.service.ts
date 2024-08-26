import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SplashScreenService {
  private _visible$ = new BehaviorSubject<boolean>(false);
  public visible$ = this._visible$.asObservable();

  public get visible() {
    return this._visible$.getValue();
  }

  public setVisible(value: boolean) {
    this._visible$.next(value);
  }
}
