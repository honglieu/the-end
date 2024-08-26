import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import {
  BreachReasonOption,
  ErrorText
} from '@/app/breach-notice/utils/breach-notice.enum';
import { IRadioButton } from '@trudi-ui';
import dayjs from 'dayjs';
import { Subject, filter, takeUntil } from 'rxjs';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/sidebar-right/interfaces/widget-calendar-event.interface';
import { TaskService } from '@services/task.service';
import { EEventType } from '@shared/enum/calendar.enum';
import { CalendarEventApiService } from '@/app/task-detail/modules/steps/calendar-event/services/calendar-event-api.service';
import { ICalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/utils/calendar-event.interface';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'breach-contract-form',
  templateUrl: './breach-contract-form.component.html',
  styleUrls: ['./breach-contract-form.component.scss']
})
export class BreachContractFormComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() modalId: string;
  @Input() breachData: TrudiStep;
  @Input() event: ITaskLinkCalendarEvent;
  @Input() isTaskEditor: boolean = false;
  @Input() isStep: boolean = false;
  @Output() onCloseStep = new EventEmitter<boolean>();
  @Output() onConfirmSuccess = new EventEmitter<string>();
  @Input() visible: boolean;

  breachForm: FormGroup;
  public radioValue: string = null;
  public radioListData: IRadioButton[] = [
    {
      label: 'Arrears - non payment of rent',
      value: 'Arrears - non payment of rent'
    },
    {
      label: 'Arrears - non payment of invoice/ fees',
      value: 'Arrears - non payment of invoice/ fees'
    },
    { label: 'Other', value: 'Other' }
  ];
  public isConfirmed: boolean = false;
  public isShowTextInput: boolean = false;
  public errorText = '';
  public disableConfirmButton: boolean = false;
  public breachReasonFromEvent: string = null;
  public remedyDateFromEvent: string = null;
  public breachReasonTypeFromEvent: BreachReasonOption = null;
  public eventId: string = null;
  private unsubscribe = new Subject<void>();
  public currentAgencyId: string;

  get remedyDate() {
    return this.breachForm.get('remedyDate');
  }

  get reason() {
    return this.breachForm.get('reason');
  }

  constructor(
    private eventCalendarService: EventCalendarService,
    private taskService: TaskService,
    private calendarEventApiService: CalendarEventApiService,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.breachForm = new FormGroup({
      remedyDate: new FormControl(
        this.remedyDateFromEvent ? this.remedyDateFromEvent : '',
        Validators.required
      ),
      reason: new FormControl(
        this.radioValue === BreachReasonOption.OTHER
          ? this.breachReasonFromEvent
          : '',
        Validators.required
      )
    });
    if (this.radioValue && this.radioValue === BreachReasonOption.OTHER) {
      this.isShowTextInput = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['event'] &&
      changes['event']?.currentValue &&
      changes['event']?.currentValue?.eventType === EEventType.BREACH_REMEDY
    ) {
      this.remedyDateFromEvent =
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          this.event.eventDate
        );
      const firstDashIndex = this.event.eventName.indexOf('-');
      this.breachReasonFromEvent =
        firstDashIndex !== -1
          ? this.event.eventName.substring(firstDashIndex + 1).trim()
          : this.event.eventName;
      this.breachReasonTypeFromEvent = [
        BreachReasonOption.NON_PAYMENT_OF_RENT,
        BreachReasonOption.NON_PAYMENT_OF_INVOICE_FEES
      ].includes(this.breachReasonFromEvent as BreachReasonOption)
        ? (this.breachReasonFromEvent as BreachReasonOption)
        : BreachReasonOption.OTHER;
      this.radioValue = this.breachReasonTypeFromEvent;
      this.eventId = this.event.id;
    }
  }

  onValueChange(event: string) {
    this.reason.markAsUntouched();
    if (event === BreachReasonOption.OTHER) {
      this.isShowTextInput = true;
      this.reason.setValidators(Validators.required);
      this.reason.updateValueAndValidity();
    } else {
      this.isShowTextInput = false;
      this.reason.clearValidators();
      this.reason.updateValueAndValidity();
    }
    this.isConfirmed = false;
  }

  onClose() {
    this.onCloseStep.next(true);
  }

  onConfirm() {
    this.isConfirmed = true;
    this.disableConfirmButton = true;
    if (this.radioValue !== BreachReasonOption.OTHER) {
      this.reason.clearValidators();
      this.reason.updateValueAndValidity();
    }
    if (
      this.remedyDate?.valid &&
      this.isConfirmed &&
      this.reason?.valid &&
      this.radioValue
    ) {
      if (
        dayjs(
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            this.remedyDate.value
          )
        ).isSame(this.remedyDateFromEvent) &&
        this.radioValue === this.breachReasonTypeFromEvent &&
        this.reason.value === this.breachReasonFromEvent
      ) {
        this.disableConfirmButton = false;
        return this.onClose();
      }

      const breachRemedyCardBody: ICalendarEvent = {
        date: this.agencyDateFormatService
          .expectedTimezoneStartOfDay(this.remedyDate.value)
          .toISOString(),
        eventId: this.event?.id ?? null,
        taskId: this.taskService.currentTask$.value?.id,
        stepType: EStepType.CALENDAR_EVENT,
        eventType: this.breachData?.fields?.eventType,
        reason:
          this.radioValue === BreachReasonOption.OTHER
            ? this.reason?.value
            : this.radioValue
      };
      if (this.eventId) {
        breachRemedyCardBody.eventId = this.eventId;
      }
      this.calendarEventApiService
        .saveCalendarEvent(breachRemedyCardBody)
        .pipe(
          filter((event) => Boolean(event)),
          takeUntil(this.unsubscribe)
        )
        .subscribe((event: ITaskLinkCalendarEvent) => {
          this.eventCalendarService.updateListEvents(event);
          this.onConfirmSuccess.emit(event.id);
          this.onClose();
          this.showSidebarRightService.handleToggleSidebarRight(true);
        });
    } else {
      this.disableConfirmButton = false;
      if (this.radioValue === null) {
        this.errorText = ErrorText.UNSELECTED;
      } else if (
        !this.reason.value &&
        this.radioValue === BreachReasonOption.OTHER
      ) {
        this.errorText = ErrorText.REQUIRED;
        this.reason?.markAsTouched();
      }
      this.remedyDate?.markAsTouched();
    }
  }

  disabledDate = (current: Date): boolean => {
    return differenceInCalendarDays(current, this.getToday()) < 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
