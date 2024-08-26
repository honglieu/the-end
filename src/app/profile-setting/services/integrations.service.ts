import { Injectable } from '@angular/core';
import {
  EIntegrationPopUp,
  EIntegrationsStatus,
  IIntegrationData,
  IPopupState
} from '@/app/profile-setting/utils/integrations.interface';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { users } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {
  private popupState: IPopupState = {
    showPopupChangeState: false,
    showPopupIntegration: false,
    showPopupSelectEvents: false
  };

  private integrationsList$: BehaviorSubject<IIntegrationData[]> =
    new BehaviorSubject<IIntegrationData[]>([]);

  private popupIntegration: BehaviorSubject<EIntegrationPopUp> =
    new BehaviorSubject<EIntegrationPopUp>(null);
  private statusIntegrationCalendar$: Subject<EIntegrationsStatus> =
    new Subject<EIntegrationsStatus>();

  constructor(private apiService: ApiService) {}

  getPopupState() {
    return this.popupState;
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  getPopupIntegration() {
    return this.popupIntegration.asObservable();
  }

  setPopupIntegration(value: EIntegrationPopUp) {
    this.popupIntegration.next(value);
  }

  getIntegrationsList() {
    return this.integrationsList$.asObservable();
  }

  getValueIntegrationsList() {
    return this.integrationsList$.value;
  }

  setIntegrationsList(value: IIntegrationData[]) {
    this.integrationsList$.next(value);
  }

  getIntegrationsCalendarStatus() {
    return this.statusIntegrationCalendar$.asObservable();
  }

  setIntegrationsCalendarStatus(value: EIntegrationsStatus) {
    this.statusIntegrationCalendar$.next(value);
  }

  getIntegrationsDataApi(): Observable<IIntegrationData[]> {
    return this.apiService.get(`${users}settings/integrations`).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }
  getIntegrationsData() {
    this.getIntegrationsDataApi().subscribe((res) => {
      this.setIntegrationsList(res);
    });
  }
}
