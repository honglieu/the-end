import { EVENT_ROUTE } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SyncPropertyTreeLeasingService } from '@/app/leasing/services/sync-property-tree-leasing.service';
import { DialogService } from '@/app/services';
import { CustomPipesModule } from '@/app/shared';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/sidebar-right/interfaces/widget-calendar-event.interface';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { BreachContractFormModule } from '@/app/task-detail/modules/steps/calendar-event/breach-notice-remedy-date/components/breach-contract-form/breach-contract-form.module';
import { ScheduleCustomEventComponentModule } from '@/app/task-detail/modules/steps/calendar-event/custom-event/components/schedule-custom-event/schedule-custom-event.module';
import { SchedulePropertyEntryModule } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/components/schedule-property-entry/schedule-property-entry.module';
import { EAction } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/components/schedule-property-entry/type/schedule-property-entry.type';
import { CalendarEventApiService } from '@/app/task-detail/modules/steps/calendar-event/services/calendar-event-api.service';
import { IInputToUpdateStatusCalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/utils/calendar-event.interface';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { differenceNowInDays } from '@core';
import { convertUTCToLocalDateTime } from '@core/time/timezone.helper';
import { RxPush } from '@rx-angular/template/push';
import {
  DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS,
  TIME_FORMAT
} from '@services/constants';
import { IngoingInspectionService } from '@services/ingoing-inspection.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { SharedService } from '@services/shared.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EEventStatus, EEventType } from '@shared/enum/calendar.enum';
import { IngoingInspectionStatus } from '@shared/enum/ingoing-inspection.enum';
import { RoutineInspectionStatus } from '@shared/enum/routine-inspection.enum';
import { ETrudiType } from '@shared/enum/trudi';
import {
  AppointmentCard,
  AppointmentCardDate
} from '@shared/types/trudi.interface';
import {
  EButtonTask,
  EButtonType,
  EButtonWidget,
  PreventButtonModule,
  PreventButtonService,
  TrudiUiModule
} from '@trudi-ui';
import dayjs from 'dayjs';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { BreachContractFormComponent } from '@/app/task-detail/modules/steps/calendar-event/breach-notice-remedy-date/components/breach-contract-form/breach-contract-form.component';
import { ScheduleCustomEventComponent } from '@/app/task-detail/modules/steps/calendar-event/custom-event/components/schedule-custom-event/schedule-custom-event.component';
import { SchedulePropertyEntryComponent } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/components/schedule-property-entry/schedule-property-entry.component';

export interface ICalendarEventOption {
  calendarOption: ECalendarOption;
  calendarEvent?: {
    id?: string;
    title?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    eventType?: EEventType;
  };
}

export enum ECalendarOption {
  SHARE_CALENDAR_INVITE = 'share_calendar_invite',
  UNLINK_INVITE = 'unlink_invite'
}

@Component({
  selector: 'area-appointment',
  templateUrl: './area-appointment.component.html',
  styleUrls: ['./area-appointment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TrudiUiModule,
    SchedulePropertyEntryModule,
    BreachContractFormModule,
    ScheduleCustomEventComponentModule,
    CustomPipesModule,
    PreventButtonModule,
    RxPush
  ]
})
export class AreaAppointmentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() appointmentCard: AppointmentCard;
  @Input() event: ITaskLinkCalendarEvent;
  @Input() calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  @Input() isShowDropdown: boolean = false;
  @Input() isPreventButton: boolean = true;

  @Output() calendarEventOption = new EventEmitter<ICalendarEventOption>();
  @Output() triggerMenu = new EventEmitter();
  @Output() isOpenAnotherModal = new EventEmitter();

  private unsubscribe = new Subject<void>();
  private inspectionSubscription: Subscription;
  public appointmentDateFormatTime: AppointmentCardDate[] = [];
  TIME_FORMAT = TIME_FORMAT;
  public inspectionStatus: string;
  public leaseRenewalStatus: string;
  public RoutineInspectionStatus = RoutineInspectionStatus;
  public ETrudiType = ETrudiType;
  public isCancelled: boolean = false;
  public isActiveExpiredDay: boolean = true;
  private isInspectionCompleted: boolean = false;
  public isShowEditIcon: boolean = false;
  public readonly ECalendarOption = ECalendarOption;
  public readonly EEventStatus = EEventStatus;
  public readonly EEventType = EEventType;
  public readonly ModalPopupPosition = ModalPopupPosition;
  public readonly EAction = EAction;
  public readonly DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS =
    DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS;
  public LIMIT_DAYS = 90;
  public ISSUE_LIMIT_DAYS = 3;
  public isArchiveMailbox: boolean;
  public isConsole: boolean;
  public dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public notOpenStatus = {
    [EEventStatus.CANCELLED]: 'cancelled',
    [EEventStatus.CLOSED]: 'closed'
  };
  public EButtonType = EButtonType;
  public EButtonWidget = EButtonWidget;
  public EButtonTask = EButtonTask;
  public isAllowUpdate = false;

  constructor(
    public cdr: ChangeDetectorRef,
    private routineInspectionService: RoutineInspectionService,
    private ingoingInspectionService: IngoingInspectionService,
    private syncPropertyTreeLeasingService: SyncPropertyTreeLeasingService,
    private eventCalendarService: EventCalendarService,
    public inboxService: InboxService,
    private calendarEventApiService: CalendarEventApiService,
    private agencyDateFormatService: AgencyDateFormatService,
    private router: Router,
    private sharedService: SharedService,
    private preventButtonService: PreventButtonService,
    private dialogService: DialogService<
      | BreachContractFormComponent
      | SchedulePropertyEntryComponent
      | ScheduleCustomEventComponent
    >
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { appointmentCard, event } = changes;
    if (appointmentCard?.currentValue) {
      this.handleUpdateAppointmentCard(appointmentCard?.currentValue);
      this.inspectionSubscription = this.subscribeInspectionStatus(
        appointmentCard?.currentValue?.taskName
      );
    }
    const eventValue = event?.currentValue as ITaskLinkCalendarEvent;
    if (eventValue) {
      this.setDefaultData(eventValue);
      this.isAllowUpdate = [
        EEventType.BREACH_REMEDY,
        EEventType.ENTRY_NOTICE,
        EEventType.CUSTOM_EVENT
      ].includes(eventValue.eventType);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.inspectionSubscription?.unsubscribe();
  }

  handleNavigate() {
    console.log('handleNavigate');
    const tz = this.agencyDateFormatService.getCurrentTimezone()?.value;
    if (this.event) {
      const startDate = convertUTCToLocalDateTime(this.event?.eventDate, tz);
      const calendarRoute = EVENT_ROUTE;
      const queryParams = {
        search: '',
        startDate,
        endDate: '',
        eventId: this.event?.id,
        clearFilter: true
      };
      const fragment = 'showHistoricalEvent';
      this.router.navigate([calendarRoute], {
        queryParams,
        fragment
      });
    }
  }

  setDefaultData(eventValue: ITaskLinkCalendarEvent) {
    switch (eventValue.eventType) {
      case EEventType.ENTRY_NOTICE:
        this.event.defaultTime = this.event?.eventDate;
        this.event.eventNameDisplay =
          'Property entry - ' + this.event.eventName;
        break;
      case EEventType.ISSUE:
        this.event.defaultTime = this.event?.eventDate;
        break;
      case EEventType.CUSTOM_EVENT:
        this.event.defaultTime = this.event?.eventDate;
        break;
      default:
        break;
    }
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  onClickOption(optionType: ECalendarOption) {
    this.triggerMenu.emit();
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    if (optionType === ECalendarOption.SHARE_CALENDAR_INVITE) {
      if (this.isPreventButton && !this.shouldHandleProcess()) return;
      const abbrev =
        this.agencyDateFormatService.getCurrentTimezone()?.abbrev || '';
      const eventName = this.event?.eventName;
      const eventDate = this.event?.eventDate
        ? this.agencyDateFormatService.formatTimezoneDate(
            this.event?.eventDate,
            DATE_FORMAT_DAYJS
          )
        : '';
      const eventStartTime = this.event.startTime
        ? this.agencyDateFormatService.formatTimezoneDate(
            this.event?.startTime,
            TIME_FORMAT
          )
        : '';
      const eventEndTime = this.event.endTime
        ? this.agencyDateFormatService.formatTimezoneDate(
            this.event?.endTime,
            TIME_FORMAT
          )
        : '';
      const eventTime =
        eventStartTime && eventEndTime
          ? `${eventStartTime} - ${eventEndTime} (${abbrev})`
          : this.agencyDateFormatService.formatTimezoneDate(
              this.event?.defaultTime,
              TIME_FORMAT,
              true
            );
      this.calendarEventOption.emit({
        calendarOption: ECalendarOption.SHARE_CALENDAR_INVITE,
        calendarEvent: {
          title:
            eventName + ' - ' + eventDate + (eventTime ? ', ' + eventTime : ''),
          eventName: eventName,
          eventDate: eventDate,
          eventTime: eventTime,
          id: this.event?.id
        }
      });
      this.isOpenAnotherModal.emit();
      this.eventCalendarService.updateSelectedCalendarEventId(this.event.id);
    } else {
      this.calendarEventOption.emit({
        calendarOption: ECalendarOption.UNLINK_INVITE,
        calendarEvent: {
          id: this.event?.id,
          eventType: this.event?.eventType
        }
      });
    }
  }

  subscribeInspectionStatus(taskName: ETrudiType) {
    switch (taskName) {
      case ETrudiType.routine_inspection:
        return this.routineInspectionService.inspectionStatus
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((data) => {
            if (data) {
              this.inspectionStatus = data;
              this.isCancelled = this.isCancelStatus(
                ETrudiType.routine_inspection
              );
              this.isShowEditIcon = [
                RoutineInspectionStatus.SCHEDULED,
                RoutineInspectionStatus.RESCHEDULED
              ].includes(this.inspectionStatus as RoutineInspectionStatus);
              this.handleUpdateAppointmentCard(this.appointmentCard);
              this.cdr.markForCheck();
            }
          });
      case ETrudiType.ingoing_inspection:
        return this.ingoingInspectionService.inspectionStatus
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((data) => {
            if (data) {
              this.inspectionStatus = data;
              this.isCancelled = this.isCancelStatus(
                ETrudiType.ingoing_inspection
              );
              this.isInspectionCompleted =
                this.inspectionStatus === IngoingInspectionStatus.COMPLETED;
              this.isShowEditIcon = [
                RoutineInspectionStatus.SCHEDULED,
                RoutineInspectionStatus.RESCHEDULED
              ].includes(this.inspectionStatus as RoutineInspectionStatus);
              this.handleUpdateAppointmentCard(this.appointmentCard);
              this.cdr.markForCheck();
            }
          });
      default:
        return null;
    }
  }

  handleUpdateAppointmentCard(appointmentCard: AppointmentCard) {
    const { title, expiresDate, taskName } = appointmentCard;
    const inspectionDateFormatted = (
      Array.isArray(expiresDate) ? expiresDate : [expiresDate]
    ).sort((x, y) => Number(x.active) - Number(y.active));

    const isDisplayOneDate = this.handleDisplayOneDate(
      taskName,
      inspectionDateFormatted
    );
    this.appointmentCard = {
      taskName,
      title,
      expiresDate: inspectionDateFormatted.filter(
        (d) => !isDisplayOneDate || d.active
      )
    };
    this.handleFormatDateTime(this.appointmentCard.expiresDate);
  }

  handleDisplayOneDate(taskName: ETrudiType, dates: AppointmentCardDate[]) {
    let isDisplayOneDate = false;
    switch (taskName) {
      case ETrudiType.routine_inspection:
      case ETrudiType.ingoing_inspection:
        isDisplayOneDate =
          this.inspectionStatus === RoutineInspectionStatus.CANCEL;
        break;
      case ETrudiType.lease_renewal:
        const remainingDay = Math.floor(
          differenceNowInDays(dates.find((d) => d.active)?.endTime)
        );
        isDisplayOneDate = remainingDay < 0;
        break;
      default:
        break;
    }
    return isDisplayOneDate;
  }

  isCancelStatus(taskName: ETrudiType) {
    let isCancelStatus = false;
    switch (taskName) {
      case ETrudiType.routine_inspection:
        isCancelStatus =
          this.inspectionStatus === RoutineInspectionStatus.CANCEL;
        break;
      case ETrudiType.ingoing_inspection:
        isCancelStatus =
          this.inspectionStatus === IngoingInspectionStatus.CANCELLED;
        break;
      case ETrudiType.lease_renewal:
      default:
        break;
    }
    this.isCancelled = isCancelStatus;
    return isCancelStatus;
  }

  handleDisplayDateTime(item: AppointmentCardDate) {
    const startTime = dayjs(item?.startTime);
    const endTime = dayjs(item?.endTime);
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    switch (this.appointmentCard.taskName) {
      case ETrudiType.ingoing_inspection:
      case ETrudiType.routine_inspection:
        return `${startTime
          .utc()
          .format(DATE_FORMAT_DAYJS + ', ' + TIME_FORMAT)} - ${endTime
          .utc()
          .format(TIME_FORMAT)}`;
      case ETrudiType.leasing:
        this.isActiveExpiredDay = false;
        return startTime.isValid() ? startTime.format(DATE_FORMAT_DAYJS) : null;
      case ETrudiType.lease_renewal:
      default:
        return `Lease expires: ${
          endTime.isValid()
            ? endTime.utc().format(DATE_FORMAT_DAYJS)
            : `Unknown date`
        }`;
    }
  }

  handleExpiredDate() {
    if (!this.event.expired) return '';
    if (this.event.expired < 1) {
      return 'expired';
    }
    return this.event.expired === 1
      ? `in ${this.event.expired} day`
      : `in ${this.event.expired} days`;
  }

  handleExpiredDay() {
    switch (this.appointmentCard.taskName) {
      case ETrudiType.routine_inspection:
        return 30;
      case ETrudiType.ingoing_inspection:
        return 3;
      case ETrudiType.leasing:
        return -1;
      case ETrudiType.lease_renewal:
      default:
        return 90;
    }
  }

  handleFormatDateTime(appointmentDate: AppointmentCardDate[]) {
    this.appointmentDateFormatTime = appointmentDate.map((item) => {
      const endTimeFormatted = [
        ETrudiType.ingoing_inspection,
        ETrudiType.routine_inspection
      ].includes(this.appointmentCard?.taskName)
        ? item?.endTime?.substring(0, 10)
        : item?.endTime;
      const isValidEndTimeFormatted = dayjs(endTimeFormatted).isValid();
      const remainingDay = Math.floor(differenceNowInDays(endTimeFormatted));
      return {
        expiredDay: remainingDay <= this.handleExpiredDay(),
        remainingDay: isValidEndTimeFormatted
          ? remainingDay < 0
            ? 'expired'
            : `${remainingDay} ${remainingDay === 1 ? ' day' : ' days'}`
          : null,
        active: item.active,
        displayDateTime: this.handleDisplayDateTime(item)
      };
    });
  }

  showPopupSync() {
    switch (this.appointmentCard?.taskName) {
      case ETrudiType.routine_inspection:
        this.routineInspectionService.showRoutineInspectionSync.next(true);
        break;
      case ETrudiType.ingoing_inspection:
        this.syncPropertyTreeLeasingService.isExpandPopupPT$.next(true);
        break;
      default:
        return;
    }
  }

  openEditModal() {
    switch (this.event.eventType) {
      case EEventType.BREACH_REMEDY:
        this.dialogService.createDialog(
          BreachContractFormComponent,
          {
            visible: true,
            event: this.event
          },
          'onCloseStep'
        );
        break;
      case EEventType.ENTRY_NOTICE:
        this.dialogService.createDialog(
          SchedulePropertyEntryComponent,
          {
            showModal: {
              isShow: true,
              action: EAction.EDIT
            },
            eventData: this.event
          },
          'onQuit'
        );
        break;
      case EEventType.CUSTOM_EVENT:
        this.dialogService.createDialog(
          ScheduleCustomEventComponent,
          {
            showModal: {
              isShow: true,
              action: EAction.EDIT
            },
            eventData: this.event
          },
          'onQuit'
        );
        break;
    }

    this.isOpenAnotherModal.emit();
    this.triggerMenu.emit();
  }

  cancelOrReopenDetailsOfBreach() {
    this.isShowDropdown = false;
    const inputToUpdate: IInputToUpdateStatusCalendarEvent = {
      eventId: this.event?.id,
      taskId: this.event?.taskId
    };
    this.calendarEventApiService
      .updateStatusCalendarEvent(inputToUpdate)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((event) => {
        if (event) {
          const listEvents = this.eventCalendarService.listEvents;
          if (listEvents?.length) {
            const updatedEvents = listEvents.map((eventItem) =>
              eventItem.id === event.id ? { ...eventItem, ...event } : eventItem
            );
            this.eventCalendarService.setListEvents(updatedEvents);
          }
        }
      });
  }

  toggleDropdown() {
    if (this.isArchiveMailbox) return;
    this.triggerMenu.emit();
  }
}
