import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ICalendarEvent,
  ICalendarEventParam,
  IToolbar
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from './calendar.service';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarToolbarService {
  private currentFilterParam: ICalendarEventParam;
  constructor(
    private calendarService: CalendarService,
    private apiService: ApiService
  ) {}
  private toolbarConfigBS: BehaviorSubject<IToolbar[]> = new BehaviorSubject<
    IToolbar[]
  >([]);
  public listToolbarConfig$ = this.toolbarConfigBS.asObservable();

  private checkAllBS = new BehaviorSubject<boolean>(false);
  public checkAll$ = this.checkAllBS.asObservable();

  private eventSelectedListBS = new BehaviorSubject<ICalendarEvent[]>([]);
  public eventSelectedList$ = this.eventSelectedListBS.asObservable();
  private currentAllEventBS = new BehaviorSubject<ICalendarEvent[]>([]);
  public currentAllEvent$ = this.currentAllEventBS.asObservable();

  setEventSelectedList(events: ICalendarEvent[]) {
    this.eventSelectedListBS.next(events);
    if (events.length === 0) {
      this.toolbarConfigBS.next([]);
      this.checkAllBS.next(false);
    }
  }

  setCurrentAllEvent(events: ICalendarEvent[]) {
    this.currentAllEventBS.next(events);
  }

  get eventSelectedList() {
    return this.eventSelectedListBS.getValue();
  }

  get currentAllEvent() {
    return this.currentAllEventBS.getValue();
  }

  setCalendarToolbar(toolbar: IToolbar[]) {
    const eventSelectedCount = this.eventSelectedList.length;
    if (toolbar.length === 0 || eventSelectedCount === 0) {
      this.toolbarConfigBS.next([]);
      return;
    }
    const calendarToolbar = [
      {
        count: eventSelectedCount,
        label: 'Selected'
      },
      ...toolbar
    ];
    this.toolbarConfigBS.next(calendarToolbar);
  }
}
