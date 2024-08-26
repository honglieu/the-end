import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { LoadingService } from '@services/loading.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import {
  ICalendarEvent,
  ICalendarEventResponse
} from '@/app/task-detail/modules/sidebar-right/interfaces/widget-calendar-event.interface';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
@Component({
  selector: 'select-event-popup',
  templateUrl: './select-event-popup.component.html',
  styleUrls: ['./select-event-popup.component.scss'],
  providers: [LoadingService]
})
export class SelectEventPopupComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  private destroy$ = new Subject<void>();
  public currentAgencyId: string = '';
  private isLastPage = false;
  private DEFAULT_PAYLOAD = {};
  private pageIndex = 1;
  private scrolledToBottom = false;
  public listEvents: ICalendarEventResponse[] = [];
  public newLinkEvent: ICalendarEvent[] = [];
  public newUnlinkEvent: ICalendarEvent[] = [];

  constructor(
    private eventCalendarService: EventCalendarService,
    public loadingService: LoadingService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    public taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.DEFAULT_PAYLOAD = {
      pageIndex: 1,
      pageSize: 20,
      agencyId: this.taskService.currentTask$.value?.agencyId,
      propertyId: this.propertyService.currentPropertyId.value,
      taskId: this.taskService.currentTaskId$.value
    };
    this.eventCalendarService.refreshEventOption(this.DEFAULT_PAYLOAD);
    this.eventCalendarService
      .getListCalendarEventOption()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.isLastPage = !res.length;
            this.listEvents = [...this.listEvents, ...res];
            this.loadingService.stopLoading();
          }
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  setListEvents(value: boolean, eventRowId: string) {
    this.listEvents = this.listEvents.map((e) => ({
      ...e,
      events: e.events.map((ev) =>
        ev.id === eventRowId
          ? {
              ...ev,
              isLinked: value
            }
          : ev
      )
    }));
  }

  onScroll() {
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= SCROLL_THRESHOLD &&
      !this.scrolledToBottom &&
      !this.isLastPage &&
      !this.loadingService.isLoading.value
    ) {
      this.onLoadMoreEvent();
      this.scrolledToBottom = true;
    } else if (
      distanceFromBottom >= SCROLL_THRESHOLD &&
      this.scrolledToBottom
    ) {
      this.scrolledToBottom = false;
    }
  }

  onLoadMoreEvent() {
    this.loadingService.onLoading();
    this.pageIndex = this.pageIndex + 1;
    this.eventCalendarService.refreshEventOption({
      pageIndex: this.pageIndex
    });
  }

  handleOptionChange(event: {
    isChecked: boolean;
    eventDataRow: ICalendarEvent;
  }) {
    const eventSelected = this.listEvents
      .flatMap((e) => e.events)
      .filter((ev) => ev.isLinked)
      .find((ev) => ev.id === event.eventDataRow.id);
    if (eventSelected && event.isChecked) {
      this.newUnlinkEvent = this.newUnlinkEvent.filter(
        (ev) => ev.id !== event.eventDataRow.id
      );
      this.eventCalendarService.setNewUnlinkEvent(this.newUnlinkEvent);
      return;
    }
    if (eventSelected && !event.isChecked) {
      this.newUnlinkEvent = [...this.newUnlinkEvent, event.eventDataRow];
      this.setListEvents(event.isChecked, event.eventDataRow.id);
      this.newLinkEvent = this.newLinkEvent.filter(
        (ev) => ev.id !== event.eventDataRow.id
      );
      this.eventCalendarService.setNewUnlinkEvent(this.newUnlinkEvent);
      this.eventCalendarService.setNewLinkEvent(this.newLinkEvent);
      return;
    }
    if (!eventSelected && event.isChecked) {
      this.newLinkEvent = [...this.newLinkEvent, event.eventDataRow];
      this.eventCalendarService.setNewLinkEvent(this.newLinkEvent);
      this.setListEvents(event.isChecked, event.eventDataRow.id);
      this.newUnlinkEvent = this.newUnlinkEvent.filter(
        (ev) => ev.id !== event.eventDataRow.id
      );
      this.eventCalendarService.setNewUnlinkEvent(this.newUnlinkEvent);
      this.eventCalendarService.setNewLinkEvent(this.newLinkEvent);
      return;
    }
    if (!eventSelected && !event.isChecked) {
      this.newLinkEvent = this.newLinkEvent.filter(
        (ev) => ev.id !== event.eventDataRow.id
      );
      this.eventCalendarService.setNewLinkEvent(this.newLinkEvent);
      return;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.eventCalendarService.setNewLinkEvent([]);
    this.eventCalendarService.setNewUnlinkEvent([]);
  }
}
