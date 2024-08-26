import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ICalendarEvent,
  ICalendarEventParam,
  ICalendarResponse,
  PopUpBulkCreateTasks
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { ApiService } from '@services/api.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { conversations } from 'src/environments/environment';
import { LoadingService } from '@services/loading.service';
import { RegionId } from '@shared/enum/region.enum';
import { INSPECTION_EVENT } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private refreshCalendarEventBS = new BehaviorSubject<ICalendarEventParam>(
    null
  );
  private scrollTodayBS = new BehaviorSubject(null);
  private _pageDownIndex = 0;
  private _pageUpIndex = 0;
  private rmInspectionType$: BehaviorSubject<[]> = new BehaviorSubject([]);
  private popupBulkCreateTasks$: BehaviorSubject<PopUpBulkCreateTasks> =
    new BehaviorSubject<PopUpBulkCreateTasks>(null);

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService
  ) {
    dayjs.locale('en');
    dayjs.updateLocale('en', {
      weekStart: 1
    });
  }

  getCalendarEventId(id: string): Observable<ICalendarEvent> {
    return this.apiService.getAPI(
      conversations,
      `calendar-event/get-by-event-id/${id}`
    );
  }

  getRmInspectionType(): Observable<[]> {
    return this.apiService.getAPI(
      conversations,
      'inspection/rm-inspection-type'
    );
  }

  getEventsFilter() {
    return this.apiService.getAPI(conversations, 'calendar/event-types');
  }

  orderEventsType(body) {
    return this.apiService.putAPI(conversations, `calendar/event-types`, body);
  }

  getListRmInspectionType() {
    return this.rmInspectionType$.asObservable();
  }

  setListRmInspectionType(value) {
    this.rmInspectionType$.next(value);
  }

  setCalendarEventParam(payload: ICalendarEventParam) {
    this.refreshCalendarEventBS.next(payload);
  }

  get calendarEventParam$() {
    if (this.refreshCalendarEventBS.value === null) {
      this.loadingService.onLoading();
    }
    return this.refreshCalendarEventBS.value;
  }

  checkMidMonth(events: ICalendarEvent[], index: number) {
    return (
      (events?.length === 2 && index !== 0) ||
      (events?.length > 2 && index === events?.length - 1) ||
      (index > 0 && index < events?.length - 1)
    );
  }

  groupDaysByMonth(dayList: ICalendarResponse[], selectedList = []) {
    const data = dayList.reduce((acc, day) => {
      const startOfMonth = dayjs(day?.date)
        .startOf('month')
        .format(SHORT_ISO_DATE);
      if (!acc[startOfMonth]) {
        acc[startOfMonth] = [];
      }
      const transFormEvents = day?.events.map((event, index) => ({
        ...event,
        date: day?.date,
        isMidMonth: this.checkMidMonth(day?.events, index)
      }));
      acc[startOfMonth].push(transFormEvents);
      acc[startOfMonth] = acc[startOfMonth].flat();
      return acc;
    }, {});
    const idSelectedList = selectedList.map((e) => e?.id);
    return Object.keys(data).reduce((pre, curr) => {
      const arr = data[curr]?.map((event, index) => {
        return {
          ...event,
          isSelected: idSelectedList.includes(event?.id),
          isStartOfMonth: index === 0,
          isEndOfMonth: index === data[curr]?.length - 1
        };
      });
      if (arr?.length) {
        arr.sort((n1, n2) => {
          return (
            new Date(n1.eventDate).getTime() - new Date(n2.eventDate).getTime()
          );
        });
        arr?.unshift({ key: curr });
        pre?.push(...arr);
      }
      return pre;
    }, []);
  }

  scrollToday(value) {
    this.scrollTodayBS.next(value);
  }

  get scrollToday$() {
    return this.scrollTodayBS.asObservable();
  }

  getScrollToday() {
    return this.scrollTodayBS.value;
  }

  get pageUpIndex() {
    return this._pageUpIndex;
  }

  set pageUpIndex(value) {
    this._pageUpIndex = value;
  }

  get pageDownIndex() {
    return this._pageDownIndex;
  }

  set pageDownIndex(value) {
    this._pageDownIndex = value;
  }

  clearPageIndex() {
    this._pageUpIndex = 0;
    this._pageDownIndex = 0;
  }

  checkRegionForArreasEvent(regionId: string) {
    return [RegionId.TAS, RegionId.ACT, RegionId.SA].includes(
      regionId as RegionId
    );
  }

  public getPopupBulkCreateTasks() {
    return this.popupBulkCreateTasks$.asObservable();
  }

  public setPopupBulkCreateTasks(popup: PopUpBulkCreateTasks) {
    this.popupBulkCreateTasks$.next(popup);
  }

  handleMapInspectionEvent(event) {
    switch (event) {
      case INSPECTION_EVENT.MOVE_IN:
        return 'Move in inspections';
      case INSPECTION_EVENT.MOVE_OUT:
        return 'Move out inspections';
      case INSPECTION_EVENT.NEW_INSPECTION_TYPE:
        return 'New inspection types';
      case INSPECTION_EVENT.PROPERTY:
        return 'Property inspections';
      case INSPECTION_EVENT.ANNUAL:
        return 'Annual inspections';
      default:
        return `${event} ${
          event.indexOf('inspection') !== -1 ? '' : 'inspections'
        }`;
    }
  }
}
