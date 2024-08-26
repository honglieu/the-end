import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil
} from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { HelpCentreService } from '@services/help-centre.service';
import { NotificationService } from '@services/notification.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { EEventStatus, EEventType } from '@shared/enum/calendar.enum';
import { TaskType } from '@shared/enum/task.enum';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { AfterViewInit } from '@angular/core';

@Component({
  selector: 'date-row',
  templateUrl: './date-row.component.html',
  styleUrls: ['./date-row.component.scss']
})
export class DateRowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('streetLine') streetLine: ElementRef;
  private unsubscribe = new Subject<void>();
  public eventId: string;
  @Input() rowData;
  @Input() isFirst: boolean = true;
  @Output() linkedTaskClick = new EventEmitter();
  @Output() checkedChange = new EventEmitter();
  @Output() linkedProperty = new EventEmitter();
  @Output() eventIdEmit = new EventEmitter();
  @Input() isActiveRow: boolean;
  public readonly EEventType = EEventType;
  public isConsole: boolean;
  public isPastDay: boolean;
  public isActiveDay: boolean;
  public monthTitle: string;
  public searchText$: Observable<string>;
  public isEventCancelled: boolean;
  public isEventClosed: boolean;
  public visiblePropertyProfile = false;
  public isTextTruncated: boolean = false;
  constructor(
    private router: Router,
    private agencyService: AgencyService,
    private calendarFilterService: CalendarFilterService,
    private taskService: TaskService,
    private calendarEventService: CalendarEventService,
    private notificationService: NotificationService,
    public helpCentreService: HelpCentreService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.searchText$ = this.calendarFilterService.searchText$.pipe(
      distinctUntilChanged(),
      debounceTime(200),
      map((value) => value?.trim())
    );
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.calendarEventService.linkedCalendarEvent
      .pipe(filter((event) => event && event.id === this.rowData?.id))
      .subscribe((res) => {
        this.rowData.totalLinkedTask = res.totalLinkedTask;
        this.rowData.latestLinkedTask = res.latestLinkedTask;
        this.eventIdEmit.emit(this.rowData?.id);
      });

    this.calendarEventService.newTaskAfterCreatedMutil$
      .pipe(filter(Boolean), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        res.forEach((event) => {
          if (event.id !== this.rowData?.id) return;
          this.rowData.latestLinkedTask.task = {
            ...this.rowData.latestLinkedTask.task,
            ...event.latestLinkedTask.task
          };
          this.eventIdEmit.emit(this.rowData?.id);
        });
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rowData']?.currentValue) {
      const today = this.agencyDateFormatService.initTimezoneToday().nativeDate;
      this.isActiveDay = dayjs(this.rowData.date).isSame(dayjs(today), 'date');
      this.isPastDay =
        dayjs(this.rowData?.date).isBefore(dayjs(today)) && !this.isActiveDay;
      this.monthTitle = dayjs(this.rowData?.key).format('MMMM YYYY');
      this.isEventCancelled =
        this.rowData.eventStatus == EEventStatus.CANCELLED;
      this.isEventClosed = this.rowData.eventStatus == EEventStatus.CLOSED;
    }
  }

  ngAfterViewInit(): void {
    this.checkStreetLineOverflow();
  }

  checkStreetLineOverflow() {
    const element = this.streetLine?.nativeElement;
    this.isTextTruncated = element?.scrollHeight > element?.clientHeight;
  }
  handleChangeSelected() {
    this.checkedChange.emit(this.rowData);
  }

  getLinkedTaskListData(id: string) {
    this.calendarEventService
      .getLinkedTaskList(id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calendarEventService.setEventLinkedTaskListData(res);
      });
  }

  handleOpenLinkTask(e: MouseEvent): void {
    e.stopPropagation();
    this.notificationService.handleCloseNotification();
    this.helpCentreService.handleCloseZendeskWidget();
    this.linkedTaskClick.emit(this.rowData);
    this.getLinkedTaskListData(this.rowData.id);
  }

  onNavigateToTask(taskId) {
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, taskId)], {
      queryParams: {
        type: TaskType.TASK,
        openEventSideBar: true,
        createFromCalendar: true
      },
      replaceUrl: true
    });
  }

  onCreateTask(event: ICalendarEvent) {
    this.taskService.calendarEventSelected$.next(event);
  }

  handleClickRow(event: MouseEvent) {
    event.stopPropagation();
    this.notificationService.handleCloseNotification();
    this.helpCentreService.handleCloseZendeskWidget();
    if (this.isEventCancelled || this.isEventClosed) return;
    this.onCreateTask(this.rowData);
  }

  toggleSelectRow() {
    this.rowData.isSelected = !this.rowData.isSelected;
    this.handleChangeSelected();
    //return false to stop propagation
    return false;
  }

  handleOpenPropertyProfile() {
    const rowData = {
      propertyId: this.rowData.propertyId,
      propertyStatus: this.rowData.propertyStatus
    };
    this.linkedProperty.emit(rowData);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
