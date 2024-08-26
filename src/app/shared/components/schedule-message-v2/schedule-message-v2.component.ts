import { TrudiService } from '@services/trudi.service';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import dayjs from 'dayjs';
import { Subject, first, takeUntil } from 'rxjs';
import {
  BreachNoticeRequestButtonAction,
  DEFAULT_DAYS_AFTER_BREACH_REMEDY_DATE
} from '@/app/breach-notice/utils/breach-notice.enum';
import { ITimezone, convertUTCToLocalDateTime } from '@core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SHORT_ISO_TIME_FORMAT } from '@services/constants';
import {
  DEFAULT_DAYS_BEFORE_INSPECTION_DATE,
  DEFAULT_TIME_INSPECTION_DATE_IN_MILLISECOND
} from '@services/routine-inspection.constants';
import { hmsToSecondsOnly, initTime } from '@shared/components/date-picker2';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ITrudiSendMsgCalendarEventConfig } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'schedule-message-v2',
  templateUrl: './schedule-message-v2.component.html',
  styleUrl: './schedule-message-v2.component.scss'
})
export class ScheduleMessageV2Component implements OnInit, OnDestroy {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() onCloseStep = new EventEmitter<boolean>();
  @Output() dateTime = new EventEmitter<string>();
  @Output() errorMsgEmitter = new EventEmitter<boolean>();
  @Output() timeSecondEmitter = new EventEmitter<number>();
  @Output() dateEmitter = new EventEmitter<number>();
  @Input() scheduleDate: string;
  @Input() defaultValue: string;
  @Input() isShowBackBtn: boolean = true;
  @Input() additionalInfo: string;
  @Input() isDateUnknown: boolean = false;
  @Input() dueDateTooltipText: string;
  @Input() action: string;
  @Input() visible: boolean = false;
  @Input() selectedEvent: ITrudiSendMsgCalendarEventConfig;
  @Input() customClassTimePicker: string;
  @Input() nzPopupStyle: object;
  public readonly datePickerFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;
  public popupModalPosition = ModalPopupPosition;
  public dateTimeFormArray = new FormArray([]);
  public formGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    time: new FormControl(null)
  });
  public timeSecond: number;
  public date: number;
  public rangeFrom: number;
  public rangeTo: number = 86400;
  public minuteControl: number = 15;
  public errorMsg: boolean = false;
  public warningMessage: string;
  public warningMessages: string[] = [
    'Please select the scheduled time after current time',
    'Please select the reminder time before inspection time'
  ];
  public dateMinus3: Date;
  public datePlus3: Date;
  public remedyDatePlusOneDay: Date;
  public specialStringDue: string;
  public isExpiredCurrentDate: boolean = false;
  public isDateMinus3AfterCurrentDate: boolean = false;
  public overdueInvoiceButtonActions: string[] = [
    CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE,
    CreditorInvoicingButtonAction.PARTPAID_SCHEDULE_TENANT_REMINDER
  ];
  public isConfirmed: boolean = false;
  private destroy$ = new Subject<void>();
  public timeZone: string = '';
  public dateError: boolean = false;
  private isInitialLoad: boolean = true;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiService: TrudiService,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService?.sendMsgForm;
  }

  get dateControl() {
    return this.formGroup.get('date');
  }

  get timeControl() {
    return this.formGroup.get('time');
  }

  ngOnInit(): void {
    this.agencyDateFormatService.timezone$
      .pipe(takeUntil(this.destroy$), first(Boolean))
      .subscribe((tz) => {
        this.timeZone = tz.value;
        this.getDefaultDateTime(tz);
      });
    this.resetIsConfirmedOnDateChange();

    this.trudiService.isConfirmSchedule$
      .pipe(takeUntil(this.destroy$), first(Boolean))
      .subscribe((res) => {
        if (!res) return;
        this.onConfirm();
        this.trudiService.isConfirmSchedule$.next(false);
      });
  }

  resetIsConfirmedOnDateChange() {
    this.dateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.handleSelectDate(value);
          this.isConfirmed = false;
        }
        this.emitDateTime();
        this.trudiSaveDraftService.setTrackControlChange('date', true);
      });
  }

  getDefaultDateTime(tz: ITimezone) {
    if (this.defaultValue) {
      const time = hmsToSecondsOnly(
        dayjs(convertUTCToLocalDateTime(this.defaultValue, tz.value)).format(
          SHORT_ISO_TIME_FORMAT
        )
      );

      const date = dayjs(convertUTCToLocalDateTime(this.defaultValue, tz.value))
        .startOf('day')
        .toDate()
        .getTime();

      this.dateControl.setValue(date);
      this.timeControl.setValue(time);

      this.handleSelectTime(time);
      this.handleSelectDate(this.defaultValue);
      const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
        this.dateControl.value,
        false
      );
      this.rangeFrom = rangeFrom;
    } else {
      const isBreachNoticeExpired =
        this.action ===
        BreachNoticeRequestButtonAction.schedule_tenant_reminder_breach_notice_expired;
      this.initValueButtonAction(this.scheduleDate);
      let currentDate = this.checkHasScheduleFromSpecialFlow()
        ? this.dateMinus3
        : this.getToday();
      const isOverdueInvoice = this.overdueInvoiceButtonActions.includes(
        this.action
      );
      if (isOverdueInvoice && !this.isExpiredCurrentDate) {
        currentDate = this.datePlus3;
      }
      if (isBreachNoticeExpired) {
        currentDate = this.remedyDatePlusOneDay;
      }
      const date = dayjs(currentDate).startOf('day').toDate().getTime();
      this.dateControl.setValue(date);
      this.handleSelectDate(currentDate);
      const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
        this.dateControl.value,
        false
      );
      this.rangeFrom = rangeFrom;
      const hourTimes = initTime(
        this.rangeFrom,
        this.rangeTo,
        true,
        true,
        this.minuteControl
      );
      const defaultTime = hourTimes.find((one) => one.disabled == false)?.value;
      this.timeControl.setValue(
        this.checkHasScheduleFromSpecialFlow()
          ? DEFAULT_TIME_INSPECTION_DATE_IN_MILLISECOND
          : defaultTime
      );
      this.timeSecond = this.timeControl.value;
      this.errorMsg = false;
      this.errorMsgEmitter.emit(this.errorMsg);
      this.timeSecondEmitter.emit(this.timeSecond);
      this.emitDateTime();
    }
  }

  emitDateTime() {
    const dateTimeString = this.storedDate();
    this.dateTime.emit(dateTimeString);
  }

  checkHasScheduleFromSpecialFlow() {
    return (
      this.scheduleDate &&
      !this.isExpiredCurrentDate &&
      (this.isDateMinus3AfterCurrentDate ||
        this.overdueInvoiceButtonActions.includes(this.action) ||
        this.remedyDatePlusOneDay)
    );
  }

  initValueButtonAction(scheduleDate: string) {
    this.isExpiredCurrentDate = dayjs(scheduleDate).isBefore(dayjs(), 'day');
    switch (this.action) {
      case CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE:
      case CreditorInvoicingButtonAction.PARTPAID_SCHEDULE_TENANT_REMINDER:
        this.datePlus3 = dayjs(scheduleDate)
          .tz(this.timeZone)
          .add(DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
          .toDate();
        break;
      case RoutineInspectionButtonAction.SEND_A_REMINDER_TO_TENANT_SCHEDULED:
        this.specialStringDue = 'Routine Inspection';
        this.dateMinus3 = dayjs(scheduleDate)
          .tz(this.timeZone)
          .add(-DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
          .toDate();
        this.isDateMinus3AfterCurrentDate = dayjs(this.dateMinus3).isAfter(
          dayjs(),
          'day'
        );
        break;
      case ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsEndOfLease:
      case ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsNoticeToVacate:
      case ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsBreakLease:
        this.specialStringDue = 'Vacate Date';
        this.dateMinus3 = dayjs(scheduleDate)
          .tz(this.timeZone)
          .add(-DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
          .toDate();
        this.isDateMinus3AfterCurrentDate = dayjs(this.dateMinus3)
          .tz(this.timeZone)
          .isAfter(this.getToday(), 'day');
        break;
      case BreachNoticeRequestButtonAction.schedule_tenant_reminder_breach_notice_expired:
        if (scheduleDate) {
          this.remedyDatePlusOneDay = dayjs(scheduleDate)
            .tz(this.timeZone)
            .add(DEFAULT_DAYS_AFTER_BREACH_REMEDY_DATE, 'day')
            .toDate();
        }
        break;
      default:
        this.dateMinus3 = dayjs(scheduleDate)
          .tz(this.timeZone)
          .add(-DEFAULT_DAYS_BEFORE_INSPECTION_DATE, 'day')
          .toDate();
        this.isDateMinus3AfterCurrentDate = dayjs(this.dateMinus3)
          .tz(this.timeZone)
          .isAfter(this.getToday(), 'day');
        break;
    }
  }

  disabledDate = (current: Date): boolean => {
    return (
      differenceInCalendarDays(current.getTime(), this.getToday().getTime()) < 0
    );
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  handleSelectDate(event) {
    const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
      new Date(event).getTime(),
      false
    );
    this.rangeFrom = rangeFrom;
    this.date = dayjs(event).startOf('day').toDate().getTime();
    this.validateDateTime();
    this.dateEmitter.emit(this.date);
  }

  validateDateTime() {
    if (this.timeSecond >= 0) {
      if (this.isAfterCurrentTime() >= 0) {
        this.errorMsg = false;
      } else {
        this.warningMessage = this.warningMessages[0];
        this.errorMsg = true;
      }
    }
    this.dateError = this.disabledDate(new Date(this.date));
    this.errorMsgEmitter.emit(this.errorMsg);
  }

  handleSelectTime(event) {
    if (typeof event === 'number' && event >= 0) {
      const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
        this.dateControl.value,
        false
      );
      this.rangeFrom = rangeFrom;
      this.timeSecond = event;
      this.errorMsg = false;
      this.validateDateTime();
      this.emitDateTime();
      if (!this.isInitialLoad) {
        this.trudiSaveDraftService.setTrackControlChange('time', true);
      }
      this.isInitialLoad = false;
    } else {
      this.timeSecond = null;
    }

    this.timeSecondEmitter.emit(this.timeSecond);
  }

  handleError(event) {
    if (event) this.validateDateTime();
  }

  handleFocus(event) {}

  onClose() {
    this.trudiSendMsgService.setPopupState({
      selectTimeSchedule: false,
      sendMessage: true
    });
    this.isCloseModal.next(true);
  }

  onBack() {
    this.isCloseModal.emit(false);
  }

  isAfter(date1, date2) {
    return dayjs(date1).isAfter(dayjs(date2));
  }

  isAfterCurrentTime() {
    const date1 = this.storedDate();
    const date2 = new Date().toISOString();
    return date1.localeCompare(date2);
  }

  storedDate() {
    const dateTime = this.agencyDateFormatService.combineDateAndTimeToISO(
      this.dateControl.value,
      this.timeSecond
    );
    return dateTime;
  }

  public onConfirm() {
    this.isConfirmed = true;
    const storedDate = this.storedDate();
    if (!this.dateControl.invalid && this.isAfterCurrentTime()) {
      this.onBack();
      this.dateTime.emit(storedDate);
    } else {
      this.validateDateTime();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
