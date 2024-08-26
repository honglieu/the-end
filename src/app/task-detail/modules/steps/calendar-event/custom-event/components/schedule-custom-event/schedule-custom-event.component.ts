import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output
} from '@angular/core';
import { differenceInCalendarDays } from 'date-fns';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TaskService } from '@services/task.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import {
  EAction,
  ShowModal
} from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/components/schedule-property-entry/type/schedule-property-entry.type';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/type/widget-calendar-event.interface';
import { CalendarEventApiService } from '@/app/task-detail/modules/steps/calendar-event/services/calendar-event-api.service';
import { ICalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/utils/calendar-event.interface';
import { CustomEventFormService } from '@/app/task-detail/modules/steps/calendar-event/custom-event/service/custom-event-form.service';
import { SHORT_ISO_TIME_FORMAT } from '@services/constants';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'schedule-custom-event',
  templateUrl: './schedule-custom-event.component.html',
  styleUrls: ['./schedule-custom-event.component.scss']
})
export class ScheduleCustomEventComponent implements OnChanges, OnDestroy {
  @Input() modalId: string;
  @Input() customEventData: TrudiStep;
  @Input() showModal: ShowModal;
  @Input() eventData: ITaskLinkCalendarEvent;
  @Input() isStep: boolean = false;
  @Output() onQuit: EventEmitter<void> = new EventEmitter();
  @Output() onUpdateStep: EventEmitter<string> = new EventEmitter();
  private unSubscribe = new Subject<void>();
  public timeFrom: number = -1;
  public isSubmitForm: boolean = false;
  public isDisabled: boolean = false;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => format.toLowerCase())
  );
  constructor(
    private customEventFormService: CustomEventFormService,
    private calendarEventApiService: CalendarEventApiService,
    private toastrService: ToastrService,
    private eventCalendarService: EventCalendarService,
    private showSidebarRightService: ShowSidebarRightService,
    private taskService: TaskService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.customEventFormService.buildForm();
  }

  ngOnChanges(changes): void {
    if (!changes['showModal']) return;
    if (changes['showModal'].currentValue?.isShow) {
      this.handleDisablePastTimeIfToday();
      if (changes['showModal']?.currentValue?.action === EAction.EDIT) {
        const eventDate =
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            this.eventData?.eventDate
          );
        const eventTime = hmsToSecondsOnly(
          dayjs(eventDate).format(SHORT_ISO_TIME_FORMAT)
        );
        this.customEventForm.patchValue({
          reason: this.eventData?.eventName,
          date: eventDate,
          time: eventTime
        });
      }
    } else {
      if (this.customEventForm) {
        this.customEventFormService.resetForm();
      }
      this.isSubmitForm = false;
    }
  }

  get customEventForm() {
    return this.customEventFormService?.customEventForm;
  }

  get eventNameControl() {
    return this.customEventForm?.get('reason');
  }

  get eventTimeControl() {
    return this.customEventForm?.get('time');
  }

  get eventDateControl() {
    return this.customEventForm?.get('date');
  }

  handleChangeEndHour(value) {
    this.customEventForm?.get('time')?.setValue(value);
  }

  handleDisablePastTimeIfToday() {
    this.eventDateControl.valueChanges
      .pipe(
        takeUntil(this.unSubscribe),
        filter((data) => !!data)
      )
      .subscribe((data) => {
        const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
          this.agencyDateFormatService.expectedTimezoneDate(data)
        );
        this.timeFrom = rangeFrom;
      });
  }

  disabledPastDate = (current: Date): boolean => {
    return differenceInCalendarDays(current, this.getToday()) < 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  handleClose() {
    this.isDisabled = false;
    this.onQuit.emit();
  }

  handleSaveOrEdit() {
    this.isSubmitForm = true;
    this.customEventForm.markAllAsTouched();
    this.customEventForm?.get('time').markAllAsTouched();
    if (this.customEventForm.invalid) {
      return;
    }
    const formData = this.customEventForm.value;
    const taskId = this.taskService.currentTaskId$.getValue();
    const time = formData.time;
    const date = formData.date;
    const datePayload = this.agencyDateFormatService.combineDateAndTimeToISO(
      date,
      time
    );

    const payload: ICalendarEvent = {
      reason: formData.reason.trim(),
      date: datePayload,
      taskId: taskId,
      stepType: EStepType.CALENDAR_EVENT,
      eventId: this.eventData?.id ?? null,
      eventType: this.customEventData?.fields?.eventType
    };
    this.isDisabled = true;
    this.calendarEventApiService
      .saveCalendarEvent(payload)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe({
        next: (event) => {
          if (event) {
            this.eventCalendarService.updateListEvents(event);
          }
          this.isDisabled = false;
          this.onUpdateStep.emit(event.id);
          this.onQuit.emit();
          this.showSidebarRightService.handleToggleSidebarRight(true);
        },
        error: (error) => {
          this.isDisabled = false;
          this.toastrService.error(error?.message);
          this.onQuit.emit();
        }
      });
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
