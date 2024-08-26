import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CalendarStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/calendar-step-form.service';
import { IRadioButton } from '@trudi-ui';
import {
  ECalendarEvent,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { isEmpty, isEqual, values } from 'lodash-es';

@Component({
  selector: 'calendar-step-form',
  templateUrl: './calendar-step-form.component.html',
  styleUrls: ['./calendar-step-form.component.scss']
})
export class CalendarStepFormComponent implements OnInit, OnDestroy {
  @Input() invalidForm: boolean = false;
  @Input() isDisableForm: boolean;
  @Input() isShowUpgradeMessage: boolean = false;
  private destroy$ = new Subject<void>();
  public radioListCalendarType: IRadioButton[] = [
    {
      label: 'Breach notice - Remedy date',
      value: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE
    },
    {
      label: 'Entry notice - Entry date',
      value: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE
    },
    {
      label: 'Custom event',
      value: ECalendarEvent.CUSTOM_EVENT
    }
  ];
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  constructor(
    private calendarStepFormService: CalendarStepFormService,
    private taskEditorService: TaskEditorService,
    private stepManagementService: StepManagementService
  ) {}

  ngOnInit(): void {
    this.calendarEventForm?.valueChanges
      ?.pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
      .subscribe((value) => {
        this.stepManagementService.setIsEditingForm(
          !values(value).every(isEmpty)
        );
      });

    this.subscribeComponentTypeValueChanges();
  }

  subscribeComponentTypeValueChanges() {
    this.calendarEventForm
      .get('eventType')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type: ECalendarEvent) => {
        this.stepManagementService.setSelectedHelpDocumentStepType(type);
      });
  }

  openHelpDocument() {
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupHelpDocument);
  }

  get calendarEventForm() {
    return this.calendarStepFormService?.calendarEventForm;
  }

  get stepName() {
    return this.calendarEventForm.get('stepName');
  }

  get eventType() {
    return this.calendarEventForm.get('eventType');
  }

  get isRequired() {
    return this.calendarEventForm.get('isRequired');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
