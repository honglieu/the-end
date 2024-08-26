import { Injectable } from '@angular/core';
import { users } from 'src/environments/environment';
import { ApiService } from './api.service';
import { BehaviorSubject } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private originHolidayListBS = new BehaviorSubject([]);
  private _holidaysList = new BehaviorSubject([]);

  public originHolidayList$ = this.originHolidayListBS.asObservable();
  public holidaysList$ = this._holidaysList.asObservable();

  setOriginHoliday(val) {
    this.originHolidayListBS.next(val);
  }

  get originHolidayList() {
    return this.originHolidayListBS.getValue();
  }

  setHolidaysList(val) {
    this._holidaysList.next(val);
  }

  get holidaysList() {
    return this._holidaysList.getValue();
  }

  currentAgencyId: string;
  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService
  ) {}

  saveChangeMultiHoliday(body) {
    return this.apiService.post(
      `${users}save-change-holiday-view-calendar`,
      body
    );
  }

  getViewCalendarByRegion(
    regionId: string,
    year: number = new Date().getFullYear()
  ) {
    return this.apiService.getAPI(
      users,
      `get-view-calendar-by-region?regionId=${regionId}&year=${year}`
    );
  }

  getHolidaysAPI(regionId: string) {
    return this.apiService.getAPI(
      users,
      `get-all-holiday-by-region?regionId=${regionId}`
    );
  }

  getListCalendarByRegion(regionId: string, year: number) {
    this.getViewCalendarByRegion(regionId, year).subscribe({
      next: (data) => {
        if (data && JSON.stringify(data) !== '{}') {
          return data.map((item) => new Date(item.date));
        }
      },
      error: () => {},
      complete: () => {}
    });
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }
}
