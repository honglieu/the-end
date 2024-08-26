import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import dayjs from 'dayjs';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { EStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TaskService } from '@services/task.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { CalendarEventApiService } from '@/app/task-detail/modules/steps/calendar-event/services/calendar-event-api.service';
import { ICalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/utils/calendar-event.interface';
import { SchedulePropertyService } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/services/schedule-property-entry.service';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/steps/calendar-event/entry-notice-entry-date/type/widget-calendar-event.interface';
import {
  EAction,
  EOptionSelect,
  ShowModal,
  reasonOption
} from './type/schedule-property-entry.type';
import { SHORT_ISO_TIME_FORMAT } from '@services/constants';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import uuid4 from 'uuid4';

@Component({
  selector: 'schedule-property-entry',
  templateUrl: './schedule-property-entry.component.html',
  styleUrls: ['./schedule-property-entry.component.scss']
})
export class SchedulePropertyEntryComponent implements OnChanges, OnDestroy {
  @Input() modalId: string;
  @Input() showModal: ShowModal;
  @Input() entryData: TrudiStep;
  @Input() eventData: ITaskLinkCalendarEvent;
  @Input() isStep: boolean = false;
  @Output() onQuit: EventEmitter<void> = new EventEmitter();
  @Output() onUpdateStep: EventEmitter<string> = new EventEmitter<string>();

  private unSubscribe = new Subject<void>();
  private eventId: string;
  public resetTimePicker: string = '';
  public EAction = EAction;
  public EOptionSelect = EOptionSelect;
  public isShowTypeReason: boolean = false;
  public entryForm: FormGroup;
  public isDisable = false;
  public titleHeader = 'Schedule property entry';
  public fromCurrent: number = 0;
  public isSubmitForm: boolean = false;
  private entryDateSubscription: Subscription;
  constructor(
    private taskService: TaskService,
    private schedulePropertyService: SchedulePropertyService,
    private eventCalendarService: EventCalendarService,
    private cdr: ChangeDetectorRef,
    private calendarEventApiService: CalendarEventApiService,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.schedulePropertyService.buildEntryForm();
  }

  get propertyEntryForm() {
    return this.schedulePropertyService.entryForm;
  }

  get reasonSelected() {
    return this.propertyEntryForm?.get('reasonSelected');
  }

  get typeReason() {
    return this.propertyEntryForm?.get('typeReason');
  }

  get dateOfEntry() {
    return this.propertyEntryForm?.get('dateOfEntry');
  }

  get timeOfEntry() {
    return this.propertyEntryForm?.get('timeOfEntry');
  }

  public radioListContactCardType: reasonOption[] = [
    {
      label: 'Inspect the property',
      value: EOptionSelect.INSPECT_THE_PROPERTY
    },
    {
      label: 'Conduct or inspection repairs',
      value: EOptionSelect.CONDUCT_OR_INSPECTION_REPAIRS
    },
    {
      label: 'Install / check smoke alarms or safety switches',
      value: EOptionSelect.INSTALL_CHECK_SMOKE_ALARMS_OR_SAFETY_SWITCHES
    },
    {
      label: 'Show the property to prospective buyer or tenant',
      value: EOptionSelect.SHOW_THE_PROPERTY_TO_PROSPECTIVE_BUYER_OR_TENANT
    },
    {
      label: 'Conduct a property valuation',
      value: EOptionSelect.CONDUCT_A_PROPERTY_VALUATION
    },
    {
      label: 'Check for suspected abandonment',
      value: EOptionSelect.CHECK_FOR_SUSPECTED_ABANDONMENT
    },
    {
      label: 'Check if a significant breach has been remedied',
      value: EOptionSelect.CHECK_IF_A_SIGNIFICANT_BREACH_HAS_BEEN_REMEDIED
    },
    {
      label: 'Other',
      value: EOptionSelect.OTHER
    }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['showModal']) return;
    if (changes['showModal']?.currentValue?.isShow) {
      this.handleDisablePastTimeIfToday();
      this.schedulePropertyService.setMarkAsUnTouchedFields([
        this.reasonSelected,
        this.typeReason,
        this.dateOfEntry,
        this.timeOfEntry
      ]);
      switch (changes['showModal'].currentValue?.action) {
        case EAction.ADD:
          if (this.entryData !== null) {
            this.handleAddScheduleFlow();
          }
          break;
        case EAction.EDIT:
          if (this.showModal?.isShow) {
            this.handleEditScheduleFlow();
          }
          break;
        default:
          break;
      }
      this.cdr.markForCheck();
    } else {
      this.isSubmitForm = false;
      this.schedulePropertyService.resetForm();
      this.resetTimePicker = uuid4() + '';
      if (this.entryDateSubscription) {
        this.entryDateSubscription.unsubscribe();
      }
    }
  }

  handleEditScheduleFlow() {
    this.resetTimePicker = null;
    this.eventId = this.eventData?.id;
    let reasonSelected = EOptionSelect.OTHER;
    let reasonText = this.eventData?.eventName;
    for (const reason in EOptionSelect) {
      if (reasonText === EOptionSelect[reason]) {
        reasonSelected = EOptionSelect[reason];
        if (!(reasonText === EOptionSelect.OTHER)) {
          reasonText = null;
        }
      }
    }

    const entryDate =
      this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        this.eventData?.eventDate
      );
    const entryTime = dayjs(entryDate).format(SHORT_ISO_TIME_FORMAT);

    this.propertyEntryForm?.patchValue({
      reasonSelected: reasonSelected,
      typeReason: reasonText,
      dateOfEntry: entryDate,
      timeOfEntry: hmsToSecondsOnly(entryTime)
    });
    this.handleShowTypeReason(this.reasonSelected?.value);
  }

  handleAddScheduleFlow() {
    this.eventId = null;
    this.schedulePropertyService.resetForm();
    this.resetTimePicker = uuid4() + '';
  }

  handleClose() {
    this.isDisable = false;
    this.onQuit.emit();
  }

  handleSaveOrEdit() {
    this.isSubmitForm = true;
    this.propertyEntryForm.markAllAsTouched();
    if (this.propertyEntryForm.invalid) {
      return;
    }
    if (this.propertyEntryForm.valid) {
      this.isDisable = true;
      const taskId = this.taskService.currentTaskId$.getValue();
      const time = this.timeOfEntry.value;
      const date = this.dateOfEntry.value;

      const datePayload = this.agencyDateFormatService.combineDateAndTimeToISO(
        date,
        time
      );

      const payload: ICalendarEvent = {
        reason: this.reasonSelected.value,
        eventId: this.eventId,
        taskId,
        date: datePayload,
        eventType: this.entryData?.fields?.eventType,
        stepType: EStepType.CALENDAR_EVENT
      };
      if (this.reasonSelected.value === EOptionSelect.OTHER) {
        payload.detailReason = this.typeReason.value;
      }
      this.calendarEventApiService.saveCalendarEvent(payload).subscribe({
        next: (event) => {
          this.isDisable = false;
          this.onUpdateStep.emit(event.id);
          this.onQuit.emit();
          this.showSidebarRightService.handleToggleSidebarRight(true);
          if (event) {
            this.eventCalendarService.updateListEvents(event);
          }
        },
        error: () => {
          this.isDisable = false;
          this.onQuit.emit();
        }
      });
    }
  }

  handleChangeEndHour(value) {
    this.propertyEntryForm?.get('timeOfEntry')?.setValue(value);
  }

  handleDisablePastTimeIfToday() {
    this.entryDateSubscription = this.dateOfEntry.valueChanges
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((data) => {
        const { rangeFrom } = this.agencyDateFormatService.buildRangeTimePicker(
          this.agencyDateFormatService.expectedTimezoneDate(data)
        );
        this.fromCurrent = rangeFrom;
      });
  }

  handleShowTypeReason(value) {
    if (value === EOptionSelect.OTHER) {
      this.isShowTypeReason = true;
      this.schedulePropertyService.setMarkAsUnTouchedFields([this.typeReason]);
      this.schedulePropertyService.setValidationTypeReasonField(
        this.typeReason
      );
    } else {
      this.isShowTypeReason = false;
      this.schedulePropertyService.clearValidationFields([this.typeReason]);
    }
  }

  onValueChange(value) {
    this.handleShowTypeReason(value);
  }

  disabledDate = (current: Date): boolean => {
    return differenceInCalendarDays(current, this.getToday()) < 0;
  };

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
