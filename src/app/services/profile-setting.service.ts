import { Injectable } from '@angular/core';
import { Observable, tap, BehaviorSubject, Subject } from 'rxjs';
import { users } from 'src/environments/environment';
import { ApiService } from './api.service';
import { AgencyService } from './agency.service';
import { AgencyService as AgencyDashboarService } from '@/app/dashboard/services/agency.service';
@Injectable()
export class ProfileSettingService {
  public editAppointmenting: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public leaveWarning = new Subject<boolean>();
  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboarService
  ) {}
  getAppointment(params: any): Observable<any> {
    return this.apiService.get(`${users}get-pm-schedule`, params).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }

  updateAppointment(body: any): Observable<any> {
    return this.apiService.post(`${users}update-pm-schedule`, body).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }
}
