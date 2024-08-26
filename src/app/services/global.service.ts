import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EPopupPlanState } from '@/app/console-setting/agencies/utils/agencies-setting.enum';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  public popupPlanState$: BehaviorSubject<EPopupPlanState> =
    new BehaviorSubject<EPopupPlanState>(null);

  getPopupPlanState(): Observable<EPopupPlanState> {
    return this.popupPlanState$.asObservable();
  }

  setPopupPlanState(value: EPopupPlanState) {
    this.popupPlanState$.next(value);
  }
}
