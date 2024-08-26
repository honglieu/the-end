import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';

import { Subject, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import { PayloadCalendarEventType } from '@shared/components/property-profile/interface/property-profile.interface';
import { EventsTabService } from './events-tab-service/events-tab.service';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { EventsTabApiService } from './events-tab-service/events-tab-api.service';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { DEFAULT_PAGE_INDEX, EVENTS_PAGE_SIZE } from './utils/constans';
import { EEventType } from '@shared/enum';

@Component({
  selector: 'events-tab',
  templateUrl: './events-tab.component.html',
  styleUrls: ['./events-tab.component.scss']
})
export class EventsTabComponent implements OnInit, OnDestroy {
  public eventsList: ICalendarEvent[] = [];
  private unsubscribe = new Subject<void>();
  public currentPayloadCalendarEvent: PayloadCalendarEventType;

  constructor(
    private readonly eventsTabApiService: EventsTabApiService,
    private readonly propertyProfileService: PropertyProfileService,
    public readonly eventsTabService: EventsTabService,
    private readonly calendarService: CalendarService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.propertyProfileService.propertyId$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => !!res)
      )
      .subscribe((propertyId) => {
        this.eventsTabApiService.setPayloadCalendarEvent({
          ...this.eventsTabApiService.payloadCalendarEvent.value,
          propertyId: propertyId,
          pageIndex: DEFAULT_PAGE_INDEX
        });
      });

    this.eventsTabApiService.payloadCalendarEvent$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((payload) => !!payload?.propertyId)
      )
      .subscribe((payload) => {
        this.eventsTabService.isEventLoading$.next(true);
        this.currentPayloadCalendarEvent = payload;
        this.getCalendarEventsByProperty(payload);
      });

    this.eventsTabService
      .getListEventTab$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((events) => {
        if (this.eventsTabService.isEventLoadMore$.value) {
          this.eventsList = [...this.eventsList, ...events];
        } else {
          this.eventsList = events;
        }
        this.cdr.markForCheck();
      });

    this.subscribeEventLink();
  }

  private getCalendarEventsByProperty(body: PayloadCalendarEventType) {
    this.eventsTabApiService
      .getCalendarEventsByProperty(body)
      .subscribe((res) => {
        const events = this.formatRawDataToEvents(res);
        this.eventsTabService.blockScroll$.next(
          !res || res?.length < EVENTS_PAGE_SIZE
        );
        this.eventsTabService.setListEventTab(events);
        this.eventsTabService.isEventLoading$.next(false);
        this.eventsTabService.isEventLoadMore$.next(false);
        this.cdr.markForCheck();
      });
  }

  subscribeEventLink() {
    this.eventsTabService
      .getEventId()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((eventId) => !!eventId),
        switchMap((eventId) => {
          return combineLatest([
            this.eventsTabApiService.getEventChangeHistory(eventId),
            this.calendarService.getCalendarEventId(eventId),
            this.eventsTabApiService.getLinkedTaskList(eventId)
          ]);
        })
      )
      .subscribe(([history, event, linked]) => {
        this.eventsTabApiService.setEventLinkedTaskListData(linked);
        this.eventsTabApiService.setLinkEvent(event);
        this.eventsTabApiService.setHistoricalEventLists$(
          history?.eventChangeHistory
        );
      });
  }

  onScrollDown() {
    if (
      this.propertyProfileService.getSelectedTab() === 2 &&
      !this.eventsTabService.blockScroll$.value &&
      !this.eventsTabService.isEventLoading$.value &&
      !this.eventsTabService.isEventLoadMore$.value
    ) {
      this.eventsTabService.isEventLoadMore$.next(true);
      this.eventsTabApiService.setPayloadCalendarEvent({
        ...this.currentPayloadCalendarEvent,
        pageIndex: this.currentPayloadCalendarEvent?.pageIndex + 1
      });

      this.cdr.markForCheck();
    }
  }

  trackByFunction(index: number): any {
    return index;
  }

  private formatRawDataToEvents(rawData: ICalendarEvent[]) {
    return rawData.map((event) => {
      if (
        [
          EEventType.ENTRY_NOTICE,
          EEventType.ISSUE,
          EEventType.CUSTOM_EVENT
        ].includes(event?.eventType)
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
