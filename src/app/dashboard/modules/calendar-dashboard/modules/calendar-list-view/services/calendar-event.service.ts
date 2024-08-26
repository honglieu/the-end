import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  IEventChangeHistoryResponse,
  IHistoricalEvent,
  LinkedTaskListDataType
} from '@shared/types/calendar.interface';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendarEventService {
  public linkedCalendarEvent: BehaviorSubject<ICalendarEvent> =
    new BehaviorSubject(null);
  private linkedTaskList: BehaviorSubject<LinkedTaskListDataType> =
    new BehaviorSubject(null);
  private historicalEventLists$: BehaviorSubject<IHistoricalEvent[]> =
    new BehaviorSubject([]);
  private newTaskAfterCreatedMutil: BehaviorSubject<ICalendarEvent[]> =
    new BehaviorSubject([]);
  public newTaskAfterCreatedMutil$ =
    this.newTaskAfterCreatedMutil.asObservable();

  constructor(private apiService: ApiService) {}

  public getEventLinkedTaskListData$() {
    return this.linkedTaskList.asObservable();
  }

  public setEventLinkedTaskListData(data: LinkedTaskListDataType) {
    this.linkedTaskList.next(data);
  }

  public getHistoricalEventLists() {
    return this.historicalEventLists$.asObservable();
  }

  public setHistoricalEventLists$(data: IHistoricalEvent[]) {
    this.historicalEventLists$.next(data);
  }

  public setNewTaskAfterCreatedMulti(data: ICalendarEvent[]) {
    this.newTaskAfterCreatedMutil.next(data);
  }

  public getLinkedTaskList(id: string) {
    return this.apiService.getAPI(
      conversations,
      'calendar-event/get-task-linked?eventId=' + id
    );
  }

  public getEventChangeHistory(
    eventId: string
  ): Observable<IEventChangeHistoryResponse> {
    return this.apiService.getAPI(
      conversations,
      'get-event-change-history/' + eventId
    );
  }
}
