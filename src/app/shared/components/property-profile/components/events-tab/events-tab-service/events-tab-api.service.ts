import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import {
  IEventChangeHistoryResponse,
  IHistoricalEvent,
  LinkedTaskListDataType
} from '@shared/types/calendar.interface';

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { PayloadCalendarEventType } from '@shared/components/property-profile/interface/property-profile.interface';
import { defaultPayloadCalendarEvent } from '@shared/components/property-profile/components/events-tab/utils/constans';

@Injectable({
  providedIn: 'root'
})
export class EventsTabApiService {
  public linkedCalendarEvent: BehaviorSubject<ICalendarEvent> =
    new BehaviorSubject(null);
  private linkedTaskList: BehaviorSubject<LinkedTaskListDataType> =
    new BehaviorSubject(null);
  private historicalEventLists$: BehaviorSubject<IHistoricalEvent[]> =
    new BehaviorSubject([]);
  public payloadCalendarEvent: BehaviorSubject<PayloadCalendarEventType> =
    new BehaviorSubject(defaultPayloadCalendarEvent);
  public payloadCalendarEvent$: Observable<PayloadCalendarEventType> =
    this.payloadCalendarEvent.asObservable();
  public refetchEventDetail$ = new Subject<void>();

  constructor(private apiService: ApiService) {}

  setPayloadCalendarEvent(value: PayloadCalendarEventType) {
    this.payloadCalendarEvent.next(value);
  }

  getCalendarEventsByProperty(body: PayloadCalendarEventType) {
    if (!body?.propertyId) return null;
    return this.apiService.getAPI(conversations, 'calendar-events', body);
  }

  public getLinkEvent$() {
    return this.linkedCalendarEvent.asObservable();
  }

  public setLinkEvent(data: ICalendarEvent) {
    this.linkedCalendarEvent.next(data);
  }

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

  public clearDetailEventdata() {
    this.setEventLinkedTaskListData(null);
    this.setLinkEvent(null);
    this.setHistoricalEventLists$([]);
  }

  public clear() {
    this.setPayloadCalendarEvent(defaultPayloadCalendarEvent);
    this.setLinkEvent(null);
  }
}
