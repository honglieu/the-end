import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class PopupVisibleStateService {
  private readonly _popupSync$ = new BehaviorSubject<boolean>(null);
  public readonly popupSync$ = this._popupSync$.asObservable();

  public setPopupSync(value: boolean) {
    this._popupSync$.next(value);
  }
}
