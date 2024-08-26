import { ECalendarEvent } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiButtonEnumStatus } from '@/app/shared';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ITaskLinkCalendarEvent } from '@/app/task-detail/modules/steps/utils/schedule-reminder.interface';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { ICalendarEventOption } from '@/app/task-detail/modules/trudi/area-appointment/area-appointment.component';
import { TaskCalendarService } from '@/app/task-detail/services/task-calendar.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

const calendarTypeMap = {
  [ECalendarEvent.BREACH_NOTICE_REMEDY_DATE]: 'breach notice',
  [ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE]: 'entry notice',
  [ECalendarEvent.CUSTOM_EVENT]: 'custom event'
};
@Component({
  selector: 'calendar-step-summary',
  templateUrl: './calendar-step-summary.component.html',
  styleUrl: './calendar-step-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarStepSummaryComponent implements OnInit, OnDestroy {
  @Input() currentStep: Omit<TrudiStep, 'reminderTimes'> & StepDetail;

  EStepStatus = TrudiButtonEnumStatus;
  calendarTypeMap = calendarTypeMap;
  calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  shareCalendarData = {
    calendarEventFiles: [],
    shareCalendarMsg: ''
  };

  isShowDropdown: boolean;
  event: Partial<ITaskLinkCalendarEvent>;
  private destroy$ = new Subject();

  constructor(
    private eventCalendarService: EventCalendarService,
    private taskCalendarService: TaskCalendarService,
    private stepService: StepService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.event = {
      ...this.currentStep.calendarEvent,
      taskId: this.currentStep.taskId
    };

    this.eventCalendarService
      .getListEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((listEvent) => {
        const currentEvent = listEvent?.find(
          (event) => event.id === this.event.id
        );
        if (!currentEvent?.id) {
          this.event = { ...this.event, isLinked: false };
        } else {
          this.event = {
            ...this.event,
            ...currentEvent,
            isLinked: true
          };
        }

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  handleCalendarEvent(option: ICalendarEventOption) {
    this.taskCalendarService.handleCalendarEvent(option);
  }

  resetCurrentStep() {
    this.stepService.setCurrentStep(null);
  }

  toggleDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
  }
}
