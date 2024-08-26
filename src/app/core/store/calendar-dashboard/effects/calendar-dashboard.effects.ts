import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  switchMap,
  tap,
  catchError,
  of,
  map,
  concatMap,
  distinctUntilChanged,
  lastValueFrom,
  takeUntil,
  take,
  Subject
} from 'rxjs';
import { calendarDashboardPageActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard-page.actions';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { calendarDashboardApiActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard-api.actions';
import { ApiService } from '@services/api.service';
import { conversations } from '@/environments/environment';
import {
  selectCalendarEventPayload,
  selectCalendarEventRawData
} from '@core/store/calendar-dashboard/selectors/calendar-dashboard.selectors';
import { isEqual } from 'lodash-es';
import {
  CalendarEvent,
  CalendarEventRawData
} from '@core/store/calendar-dashboard/types';
import { ICalendarEventParam } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { TrudiIndexedDBStorageKey } from '@core/storage';
import { TrudiIndexedDBIndexKey } from '@core/storage/indexed-db/indexed-db-storage-key.enum';
import { EEventType, GroupType } from '@shared/enum';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';
import { EScrollStatus } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/calendar-list-view.component';
import { CalendarDashboardCacheService } from '@core/store/calendar-dashboard/services/calendar-dashboard-memory-cache.service';
import { CompanyService } from '@services/company.service';
import dayjs from 'dayjs';
import { TrudiEffect } from '@core/store/shared/trudi-effect';

@Injectable()
export class CalendarDashboardEffects extends TrudiEffect {
  get eventSelectedList() {
    return this.calendarToolbarService.eventSelectedList;
  }

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(calendarDashboardPageActions.payloadChange),
      switchMap(({ payload }) => {
        return this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            this.calendarService.setCalendarEventParam(payload);
            const serverData$ = new Subject<void>();
            if (this.shouldCacheTaskGroups(payload)) {
              // emit data when api response
              const handleGetCacheSuccess = (cache: Array<CalendarEvent>) => {
                const cachedRawData = this.formattedFromDB(cache);
                const cachedCalendarList =
                  this.formatRawDataToEvents(cachedRawData);
                return this.store.dispatch(
                  calendarDashboardApiActions.getCacheCalendarDashboardSuccess({
                    events: cachedCalendarList,
                    rawData: cachedRawData
                  })
                );
              };
              const type = this.getTypeEvent(payload?.isFocusedView);
              const memoryCache = this.calendarDashboardCacheService.get(
                `${payload.startDate.toString()}-${type}-${companyId}`
              );
              if (memoryCache) {
                handleGetCacheSuccess(memoryCache);
              } else {
                const cacheData$ = this.getCacheEvents(payload, companyId).pipe(
                  // if data come from server first, then cache data will be ignored
                  takeUntil(serverData$),
                  take(1),
                  tap((events) => {
                    handleGetCacheSuccess(events);
                  }),
                  catchError((error) => of(error))
                );
                cacheData$.subscribe();
              }
              return this.getAllCalendarEvents(payload, companyId).pipe(
                tap(() => {
                  serverData$.next();
                  serverData$.complete();
                })
              );
            }
            return this.getAllCalendarEvents(payload, companyId);
          })
        );
      })
    )
  );

  readonly pageChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(calendarDashboardPageActions.pageChange),
      concatLatestFrom(() => [
        this.store.select(selectCalendarEventPayload),
        this.store.select(selectCalendarEventRawData)
      ]),
      distinctUntilChanged((pre, curr) => isEqual(pre, curr)),
      concatMap(([{ pageSize, pageIndex, scrollStatus }, payload, rawData]) => {
        const mappedPayload = {
          ...payload,
          pageIndex: pageIndex.toString(),
          pageSize: pageSize.toString()
        } as ICalendarEventParam;
        this.calendarService.setCalendarEventParam(mappedPayload);
        const serverData$ = this.getAllCalendarEventApi(mappedPayload);

        return serverData$.pipe(
          map((response) => {
            // NOTE: handle data is duplicated when user was scrolling up/down
            const calendarEventsData = this.handleDataWhenPageChange(
              response,
              scrollStatus,
              rawData
            );
            return calendarDashboardApiActions.getCalendarDashboardSuccess({
              events: calendarEventsData.data,
              rawData: calendarEventsData.rawData
            });
          })
        );
      })
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(calendarDashboardPageActions.exitPage),
        map(() => {
          this.calendarDashboardCacheService.clear();
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private apiService: ApiService,
    private calendarService: CalendarService,
    private calendarToolbarService: CalendarToolbarService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone,
    private companyService: CompanyService,
    private readonly calendarDashboardCacheService: CalendarDashboardCacheService
  ) {
    super();
  }

  private getAllCalendarEventApi(payload) {
    if (payload) {
      return this.apiService.postAPI(
        conversations,
        'calendar-event/get-all-calendar-events',
        {
          ...payload,
          startDate: payload.date || payload.startDate,
          endDate: payload.endDate,
          pageIndex: payload.pageIndex,
          pageSize: payload.pageSize,
          filter: payload.filter,
          search: payload.search,
          isShowEventWithoutTasks: payload.isShowEventWithoutTasks
        }
      );
    } else {
      return of([]);
    }
  }

  private getAllCalendarEvents(payload, companyId: string) {
    return this.getAllCalendarEventApi(payload).pipe(
      catchError((error) => {
        return of(null);
      }),
      tap(
        (rawData) =>
          rawData && this.handleCacheCalendarEvents(payload, rawData, companyId)
      ),
      map((rawData) => {
        if (!rawData) {
          return calendarDashboardApiActions.getCalendarEventsFailure({
            error: null
          });
        }
        const calendarList = this.formatRawDataToEvents(rawData);
        const calendarListCache = this.mappingData(rawData, payload);
        this.setDataToInMem(payload, calendarListCache, companyId);

        return calendarDashboardApiActions.getCalendarDashboardSuccess({
          events: calendarList,
          rawData,
          payload: payload
        });
      })
    );
  }

  private setDataToInMem(
    payload: ICalendarEventParam,
    data: CalendarEvent[],
    companyId: string
  ) {
    const type = this.getTypeEvent(payload?.isFocusedView);

    if (this.shouldCacheTaskGroups(payload)) {
      this.calendarDashboardCacheService.set(
        `${payload.startDate.toString()}-${type}-${companyId}`,
        data
      );
    }
  }

  private updateCacheCalendarDashboard(events: CalendarEvent[]) {
    return this.indexedDBService
      .update(TrudiIndexedDBStorageKey.CALENDAR_DASHBOARD, {
        events
      })
      .pipe(
        catchError(() => {
          return of(null);
        })
      )
      .subscribe();
  }

  private handleCacheCalendarEvents(
    payload: ICalendarEventParam,
    response: CalendarEventRawData[],
    companyId: string
  ) {
    this.scheduleLowPriorityTask(() => {
      const events = this.mappingData(response, payload);
      if (this.shouldCacheTaskGroups(payload)) {
        this.updateDataIntoIndexedDB(events, payload, companyId);
      }
    });
  }

  private handleDataWhenPageChange(
    res: CalendarEventRawData[],
    scrollStatus: EScrollStatus,
    rawData: CalendarEventRawData[]
  ) {
    let data = [];
    if (scrollStatus === EScrollStatus.UP) {
      data = this.handleDuplicateData(
        [...res].reverse(),
        scrollStatus,
        rawData
      );
    } else if (scrollStatus === EScrollStatus.DOWN) {
      data = this.handleDuplicateData(res, scrollStatus, rawData);
    } else {
      data = res;
    }
    return {
      data: this.formatRawDataToEvents(data),
      rawData: data
    };
  }

  handleDuplicateData(
    newData: CalendarEventRawData[],
    scrollStatus: EScrollStatus,
    rawData: CalendarEventRawData[]
  ): CalendarEventRawData[] {
    newData.forEach((it) => {
      const data = rawData.find((x) => x.date === it.date);
      if (data) {
        scrollStatus === EScrollStatus.UP
          ? data.events.unshift(...it.events)
          : data.events.push(...it.events);
      } else {
        scrollStatus === EScrollStatus.UP
          ? rawData.unshift(it)
          : rawData.push(it);
      }
    });
    return rawData;
  }

  private async updateDataIntoIndexedDB(
    res: CalendarEvent[],
    payload: ICalendarEventParam,
    companyId: string
  ) {
    const type = this.getTypeEvent(payload?.isFocusedView);
    const cachedEvents = await lastValueFrom(
      this.getCacheEvents(payload, companyId)
    );
    const compareToken = `${payload.startDate}-${type}-${companyId}`;
    const cachedEventToBeUpdated = [];
    const deletedEventIds = [];
    const updatedDataEvent = res.map((item) => {
      const _existed = cachedEvents.find((x) => x.id === item.id);
      return {
        ..._existed,
        ...item,
        companyId
      };
    });
    for (const cachedEvent of cachedEvents) {
      if (
        `${cachedEvent.date}-${cachedEvent.type}-${companyId}` === compareToken
      ) {
        cachedEventToBeUpdated.push(cachedEvent);
        deletedEventIds.push([cachedEvent.id, cachedEvent.type, companyId]);
      }
    }
    if (deletedEventIds.length) {
      const deleteResult = await lastValueFrom(
        this.indexedDBService.bulkDelete(
          TrudiIndexedDBStorageKey.CALENDAR_DASHBOARD,
          deletedEventIds
        )
      );
      console.debug('delete task group result', deleteResult);
    }
    if (res) {
      const addResult = await lastValueFrom(
        this.indexedDBService.bulkAdd(
          TrudiIndexedDBStorageKey.CALENDAR_DASHBOARD,
          updatedDataEvent
        )
      );
      console.debug('add task group result', addResult);
    }
  }

  getCacheEvents(payload: ICalendarEventParam, companyId: string) {
    let { startDate, isFocusedView, endDate } = payload;
    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      [startDate, endDate] = [endDate, startDate];
    }

    const type = this.getTypeEvent(isFocusedView);
    return this.indexedDBService
      .getAllByIndex<CalendarEvent>(
        TrudiIndexedDBStorageKey.CALENDAR_DASHBOARD,
        `${TrudiIndexedDBIndexKey.DATE}, ${TrudiIndexedDBIndexKey.TYPE}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
        IDBKeyRange.bound(
          [startDate, type, companyId],
          [endDate, type, companyId]
        )
      )
      .pipe(
        catchError((err) => {
          return [];
        })
      );
  }

  private getTypeEvent(isFocusedView: boolean) {
    return isFocusedView ? GroupType.MY_TASK : GroupType.TEAM_TASK;
  }
  private shouldCacheTaskGroups(payload: ICalendarEventParam) {
    if (!payload) return false;
    if (payload.search?.length) return false;
    if (payload.filter?.agencyIds?.length) return false;
    if (payload.filter?.eventTypes?.length) return false;
    if (payload.filter?.propertyManagerIds?.length) return false;
    if (!payload.endDate) return false;
    return true;
  }

  private mappingData(
    rawData: CalendarEventRawData[],
    payload: ICalendarEventParam
  ) {
    const mappedData: CalendarEvent[] = rawData.flatMap((item) => {
      return item.events.map((event) => {
        return {
          ...event,
          date: item.date,
          type: payload?.isFocusedView ? GroupType.MY_TASK : GroupType.TEAM_TASK
        };
      });
    });
    return mappedData;
  }

  private formatRawDataToEvents(rawData: CalendarEventRawData[]) {
    const data = this.calendarService.groupDaysByMonth(
      rawData,
      this.eventSelectedList
    );
    return data.map((event) => {
      if (
        event?.eventType === EEventType.ENTRY_NOTICE ||
        event?.eventType === EEventType.ISSUE ||
        event?.eventType === EEventType.CUSTOM_EVENT
      ) {
        if ([EEventType.ENTRY_NOTICE].includes(event?.eventType)) {
          event.eventName = 'Property entry - ' + event?.eventName;
        }
        return {
          ...event,
          defaultTime: event.eventDate
        };
      }
      return event;
    });
  }

  private formattedFromDB(events: CalendarEvent[]) {
    const formattedData: CalendarEventRawData[] = events.reduce((acc, item) => {
      const existed = acc.find((x) => x.date === item.date);
      if (existed) {
        existed.events.push(item);
        existed.events.sort((n1, n2) => {
          return (
            new Date(n1.eventDate).getTime() - new Date(n2.eventDate).getTime()
          );
        });
      } else {
        const dataEvents = this.sortEvents([item]);
        acc.push({
          date: item.date,
          events: dataEvents
        });
      }
      return acc;
    }, []);
    return formattedData;
  }

  sortEvents(events: CalendarEvent[]) {
    return events.sort((n1, n2) => {
      return (
        new Date(n1.eventDate).getTime() - new Date(n2.eventDate).getTime()
      );
    });
  }
}
