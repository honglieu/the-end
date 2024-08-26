import { Component, OnInit, OnDestroy } from '@angular/core';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { Portfolio } from '@shared/types/user.interface';
import { combineLatest, filter, of, Subject, switchMap, takeUntil } from 'rxjs';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import dayjs from 'dayjs';
import {
  ICalendarEvent,
  IWeekTittle
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { selectCalendarEvents } from '@core/store/calendar-dashboard';
import { Store } from '@ngrx/store';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import {
  EventDatetimePickerOptions,
  EventDatetimePickerType,
  durationOfPicker
} from './event-datetime-picker/event-datetime-picker.enums';
import { SharedService } from '@services/shared.service';
@Component({
  selector: 'calendar-header',
  templateUrl: './calendar-header.component.html',
  styleUrls: ['./calendar-header.component.scss']
})
export class CalendarHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // TODO should be enable in Calendar View US
  // readonly tabs = [{ title: 'List', link: 'calendar-list-view' }]
  public dateRange: Date[] = [];
  private currentDateRange: Date[] = [];

  public tooltipDate = '';

  public portfolios: Portfolio[] = [];
  public events: ICalendarEvent[] | IWeekTittle[] = [];

  private currentPortfolios: string[] = null;
  private currentAgencies: string[] = null;

  private currentEventId: string = '';
  public customTime: boolean = false;

  private isConsole = this.sharedService.isConsoleUsers();

  public isCheckedShowEventWithoutTasks: boolean = false;
  constructor(
    private calendarFilterService: CalendarFilterService,
    private calendarService: CalendarService,
    private activatedRoute: ActivatedRoute,
    private calendarToolbarService: CalendarToolbarService,
    private agencyDateFormatService: AgencyDateFormatService,
    private calendarEventService: CalendarEventService,
    private store: Store,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCheckedShowEventWithoutTasks();
    this.getCurrentPortfolios();
    this.getCurrentAgencies();
    this.getSelectedRange();
    this.getCurrentEventId();
    this.onStoreChange();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.handleCalendarParams(params);
        if (params?.['clearFilter']) {
          this.calendarFilterService.clearAllFilterEvents();
        }
      });
    this.getToday();

    this.calendarFilterService.customTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isCustomTime) => {
        this.customTime = isCustomTime;
      });
  }

  getToday() {
    this.agencyDateFormatService.timezone$.subscribe((timezone) => {
      if (timezone) {
        this.tooltipDate = this.agencyDateFormatService.formatTimezoneDate(
          new Date(),
          'dddd, MMM DD'
        );
      }
    });
  }

  getSelectedRange(): void {
    this.calendarFilterService
      .getSelectedDateRange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((range) => {
        this.currentDateRange = range;
      });
  }

  getCurrentPortfolios(): void {
    this.calendarFilterService
      .getPortfolioSelected()
      .pipe(takeUntil(this.destroy$))
      .subscribe((portfolios) => {
        this.currentPortfolios = portfolios;
      });
  }

  getCurrentAgencies(): void {
    this.calendarFilterService
      .getSelectedAgencies()
      .pipe(takeUntil(this.destroy$))
      .subscribe((agencies) => {
        this.currentAgencies = agencies;
      });
  }

  getCheckedShowEventWithoutTasks(): void {
    this.calendarFilterService
      .getShowEventWithoutTasks$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.isCheckedShowEventWithoutTasks = status;
      });
  }

  getCurrentEventId(): void {
    this.calendarFilterService
      .getEventId()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((eventId) => {
          if (!eventId) {
            return of([null, null]);
          }
          this.currentEventId = eventId;

          return combineLatest([
            this.calendarService.getCalendarEventId(eventId),
            this.calendarEventService.getLinkedTaskList(eventId)
          ]);
        })
      )
      .subscribe(([event, linked]) => {
        if (!event) {
          this.calendarFilterService.setDataEvent([null, null]);
          return;
        }
        const { eventDate } = event;
        let eventDateDayjs = dayjs(eventDate).tz(
          this.agencyDateFormatService.getCurrentTimezone()?.value
        );
        const dateFormat =
          this.agencyDateFormatService.dateFormat$?.value ||
          JSON.parse(localStorage.getItem('dateFormat')) ||
          {};
        const { DATE_FORMAT_DAYJS } = dateFormat;

        const startDateWithEvent = dayjs(
          dayjs().format(DATE_FORMAT_DAYJS),
          DATE_FORMAT_DAYJS
        ).startOf('day');

        const endDateWithEvent = dayjs(
          dayjs(eventDateDayjs).format(DATE_FORMAT_DAYJS),
          DATE_FORMAT_DAYJS
        ).startOf('day');

        let duration = endDateWithEvent.diff(startDateWithEvent, 'month');

        // Add or subtract one month if the eventDate is in the future or past relative to the current date,
        // to display the correct dateRange.
        if (endDateWithEvent.isBefore(startDateWithEvent)) {
          duration -= 1;
        } else {
          duration += 1;
        }

        let durationType;
        let endDate;

        if (durationOfPicker.includes(duration)) {
          durationType = EventDatetimePickerType[duration.toString()];
          endDate = dayjs(startDateWithEvent).add(
            EventDatetimePickerOptions[durationType],
            'month'
          );
        } else {
          endDate = endDateWithEvent;
        }

        this.dateRange = [startDateWithEvent.toDate(), endDate.toDate()];

        if (this.dateRange && this.dateRange !== this.currentDateRange) {
          this.calendarFilterService.setSelectedDateRange(this.dateRange);
        }
        this.calendarFilterService.setDataEvent([event, linked]);
      });
  }

  handleCalendarParams(params: Params) {
    const eventId = params?.['eventId'];
    let startDateParam = params?.['startDate'] || this.currentDateRange[0];
    let endDateParam = params?.['endDate'] || this.currentDateRange[1];
    let showEventWithoutTasks = params?.['isShowEventWithoutTasks'];
    showEventWithoutTasks = showEventWithoutTasks === 'true';

    const eventSelectedParam = params?.['eventTypes'];
    const searchParam = params?.['search'];
    startDateParam = dayjs(startDateParam);
    endDateParam = dayjs(endDateParam);
    const selectedDateRange = [startDateParam.toDate(), endDateParam.toDate()];
    this.dateRange = selectedDateRange;
    const portfolios =
      typeof params?.['portfolios'] === 'string'
        ? [params?.['portfolios']]
        : params?.['portfolios'];
    const agencyIds =
      typeof params?.['agencyIds'] === 'string'
        ? [params?.['agencyIds']]
        : params?.['agencyIds'];

    if (portfolios && portfolios !== this.currentPortfolios) {
      this.calendarFilterService.setPortfolioSelected(portfolios);
    }

    if (agencyIds && agencyIds !== this.currentAgencies) {
      this.calendarFilterService.setSelectedAgencies(agencyIds);
    }

    if (eventId && eventId !== this.currentEventId) {
      this.calendarFilterService.setEventId(eventId);
    }

    if (selectedDateRange && selectedDateRange !== this.currentDateRange) {
      this.calendarFilterService.setSelectedDateRange(selectedDateRange);
    }

    if (
      showEventWithoutTasks &&
      showEventWithoutTasks !== this.isCheckedShowEventWithoutTasks
    ) {
      this.calendarFilterService.setShowEventWithoutTasks(
        showEventWithoutTasks
      );
    }

    if (eventSelectedParam) {
      this.calendarFilterService.setEventTypeSelected(eventSelectedParam);
    }

    if (searchParam) {
      this.calendarFilterService.searchText = searchParam;
    }
  }

  handlePick(event: Date[]) {
    if (Array.isArray(event)) {
      this.calendarFilterService.setSelectedDateRange(event);
    }
    this.calendarToolbarService.setEventSelectedList([]);
    this.calendarFilterService.setEventId(null);
  }
  private onStoreChange() {
    const calendarEventRes$ = this.store
      .select(selectCalendarEvents)
      .pipe(filter(Boolean));
    combineLatest([calendarEventRes$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([res]) => {
        this.events = res;
      });
  }

  onCheckboxChange(status: boolean) {
    this.calendarFilterService.setShowEventWithoutTasks(status);
    this.calendarFilterService.setEventId(null);
  }

  searchChange() {
    this.calendarFilterService.setEventId(null);
  }

  ngOnDestroy(): void {
    this.calendarService.clearPageIndex();
    this.destroy$.next(null);
    this.calendarFilterService.setEventId(null);
  }

  get searchText() {
    return this.calendarFilterService.searchText;
  }

  set searchText(value: string) {
    this.calendarFilterService.searchText = value;
  }
}
