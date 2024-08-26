import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class EventsTabService {
  private eventId$: BehaviorSubject<string> = new BehaviorSubject(null);
  private listEventTab: BehaviorSubject<ICalendarEvent[]> = new BehaviorSubject(
    []
  );
  public blockScroll$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isEventLoadMore$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isEventLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public eventNameDetail$: BehaviorSubject<string> = new BehaviorSubject(null);

  getEventId(): BehaviorSubject<string> {
    return this.eventId$;
  }

  setEventId(data: string) {
    this.eventId$.next(data);
  }

  public getListEventTab$() {
    return this.listEventTab.asObservable();
  }

  public setListEventTab(data: ICalendarEvent[]) {
    this.listEventTab.next(data);
  }

  public clear() {
    this.setListEventTab([]);
    this.setEventId(null);
  }
}
