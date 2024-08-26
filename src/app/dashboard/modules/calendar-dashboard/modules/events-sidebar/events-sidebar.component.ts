import { Component, Inject, OnInit } from '@angular/core';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { CompanyService } from '@services/company.service';
import { ECRMId, EEventType, EEventTypes, ERMEvents } from '@shared/enum';
import { DOCUMENT } from '@angular/common';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { ICalendarEventFilter } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'events-sidebar',
  templateUrl: './events-sidebar.component.html',
  styleUrls: ['./events-sidebar.component.scss']
})
export class EventsSidebarComponent implements OnInit {
  public events = [];
  public eventTypeList: string[] = [];
  private destroy$ = new Subject<void>();
  public listRmInspectionTypes: [] = [];
  public typeCRM: ECRMId;
  public selectedEvent: string;
  public isConsole: boolean = false;

  constructor(
    private calendarService: CalendarService,
    private companyService: CompanyService,
    @Inject(DOCUMENT) private document: Document,
    private calendarFilterService: CalendarFilterService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getEventTypeSelected();
    this.getListEventFilter();
  }

  getListEventFilter() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        filter(Boolean),
        switchMap((company) => {
          this.typeCRM = company?.CRM as ECRMId;
          return this.calendarService.getEventsFilter();
        })
      )
      .subscribe((res) => {
        this.mapEventTypes(res?.eventTypes);
      });
  }

  getEventTypeSelected() {
    this.calendarFilterService
      .getEventTypeSelected()
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((eventType) => {
        this.handleSelectedEvent(eventType);
      });
  }

  private mapEventTypes(events) {
    this.events = events.map((item) => ({
      value: item === EEventType.ALL_EVENT ? null : item,
      label:
        this.typeCRM === ECRMId.RENT_MANAGER
          ? ERMEvents?.[item] ||
            this.calendarService.handleMapInspectionEvent(item)
          : EEventTypes?.[item]
    }));
  }

  handleStartDrag() {
    this.document.body.click();
  }

  handleSelectedEvent(selectedEvent) {
    this.selectedEvent = selectedEvent;
    this.calendarFilterService.setEventTypeSelected(this.selectedEvent);
    this.calendarFilterService.setDataEvent(null);
    this.calendarFilterService.setEventId(null);
  }

  public dropped(event: CdkDragDrop<ICalendarEventFilter[]>) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    const newListEvent = event.container.data
      .map((it, index) => ({
        ...it,
        order: index + 1
      }))
      .map((event) => {
        return event.value || 'ALL_EVENT';
      });
    const payload = {
      eventTypes: newListEvent
    };
    this.calendarService
      .orderEventsType(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.mapEventTypes(res.eventTypes);
      });
  }
}
