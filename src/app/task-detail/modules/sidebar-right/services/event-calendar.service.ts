import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, Subject, filter } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  ICalendarEventResponse,
  ITaskLinkCalendarEvent,
  ITaskLinkCalendarEventResponse
} from '@/app/task-detail/modules/sidebar-right/interfaces/widget-calendar-event.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import dayjs from 'dayjs';

interface ILinkEventPayload {
  pageIndex?: number;
  pageSize?: number;
  agencyId: string;
  propertyId: string;
  taskId: string;
}
@Injectable({
  providedIn: 'root'
})
export class EventCalendarService {
  private listEvents$ = new BehaviorSubject<ITaskLinkCalendarEvent[]>([]);
  private linkEventPayload$ = new BehaviorSubject<ILinkEventPayload>(null);
  private listEventLinked$ = new BehaviorSubject<string>(null);
  private selectedCalendarEventId = new BehaviorSubject<string>(null);
  private newLinkEvent = new BehaviorSubject([]);
  private newUnlinkEvent = new BehaviorSubject([]);
  private refreshCalendarEvent$ = new Subject<void>();
  public refreshCalendarEventS = this.refreshCalendarEvent$.asObservable();
  public isShowSelectEventPopup = new BehaviorSubject<boolean>(false);
  constructor(
    private apiService: ApiService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  public onRefreshListCalendarEvent() {
    this.refreshCalendarEvent$.next();
  }
  getListCalendarEventOption(): Observable<ICalendarEventResponse[]> {
    return this.linkEventPayload$.asObservable().pipe(
      filter((res) => !!res),
      switchMap((res) =>
        this.apiService.getAPI(
          conversations,
          'calendar-event/get-by-task-and-property' +
            `?pageIndex=${res.pageIndex}` +
            `&pageSize=${res.pageSize}` +
            `&propertyId=${res.propertyId}` +
            `&taskId=${res.taskId}`,
          { agencyId: res.agencyId }
        )
      )
    );
  }
  getListEventCalendarWidget(
    taskId: string
  ): Observable<ITaskLinkCalendarEventResponse> {
    return this.listEventLinked$.pipe(
      // filter-out first null value
      filter((value, i) => i > 0 || value !== null),
      switchMap((res) => {
        const id = res || taskId;
        return this.apiService.getAPI(
          conversations,
          `task/get-event-linked?taskId=${id}&isGetSharingMessage=true`
        );
      })
    );
  }
  linkToEvent(res) {
    return this.apiService.postAPI(conversations, 'link-event-task', {
      taskId: res.taskId,
      calendarEventIds: res.calendarEventIds
    });
  }
  unlinkToEvent(res) {
    return this.apiService.postAPI(conversations, 'unlink-event-task', {
      taskId: res.taskId,
      calendarEventIds: res.calendarEventIds
    });
  }
  getNewLinkEvent() {
    return this.newLinkEvent.value;
  }
  getNewUnlinkEvent() {
    return this.newUnlinkEvent.value;
  }
  setNewLinkEvent(res) {
    this.newLinkEvent.next(res);
  }
  setNewUnlinkEvent(res) {
    this.newUnlinkEvent.next(res);
  }
  refreshEventOption(payload: Partial<ILinkEventPayload>) {
    this.linkEventPayload$.next({
      ...this.linkEventPayload$.value,
      ...payload
    });
  }
  refreshListEventCalendarWidget(taskId: string) {
    this.listEventLinked$.next(taskId);
  }
  get getSelectedCalendarEventId() {
    return this.selectedCalendarEventId.getValue();
  }
  get listEvents() {
    return this.listEvents$.value;
  }
  getListEvents() {
    return this.listEvents$.asObservable();
  }

  setListEvents(value: ITaskLinkCalendarEvent[]) {
    return this.listEvents$.next(value);
  }

  updateListEvents(event: ITaskLinkCalendarEvent) {
    const listEvents = this.listEvents;
    const existedEvent = listEvents.find(
      (eventItem) => eventItem.id === event.id
    );
    let updatedEvents: ITaskLinkCalendarEvent[];
    const eventNew = {
      ...event,
      expired: dayjs(
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          event.eventDate
        )
      )
        .startOf('day')
        .diff(
          dayjs(
            this.agencyDateFormatService.initTimezoneToday().nativeDate
          ).startOf('day'),
          'days'
        )
    };

    if (existedEvent) {
      updatedEvents = listEvents.map((eventItem) =>
        eventItem.id === eventNew.id ? { ...eventItem, ...eventNew } : eventItem
      );
    } else {
      updatedEvents = listEvents?.length
        ? [...listEvents, eventNew]
        : [eventNew];
    }
    updatedEvents?.sort(
      (a, b) =>
        new Date(a?.eventDate).getTime() - new Date(b?.eventDate).getTime()
    );
    this.setListEvents(updatedEvents);
  }

  updateSelectedCalendarEventId(id: string | null) {
    this.selectedCalendarEventId.next(id);
  }
}
