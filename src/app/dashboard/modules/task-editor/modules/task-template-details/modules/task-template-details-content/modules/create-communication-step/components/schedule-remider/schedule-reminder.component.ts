import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { ICalendarEventType } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';

@Component({
  selector: 'schedule-reminder',
  templateUrl: './schedule-reminder.component.html',
  styleUrls: ['./schedule-remider.component.scss']
})
export class ScheduleReminderComponent implements OnInit, OnDestroy {
  public scheduleReminderForm: FormGroup;
  public events = [];
  private destroy$ = new Subject<void>();

  constructor(
    private communicationStepFormService: CommunicationStepFormService,
    private agencyService: AgencyService,
    private templateTreeService: TemplateTreeService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorApiService: TaskEditorApiService,
    private titleCasePipe: TrudiTitleCasePipe
  ) {}
  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.subscribeCalendarEvent(res.crmSystemKey);
      });

    this.scheduleReminderForm = this.communicationStepFormService
      .getCustomForm as FormGroup;
  }
  subscribeCalendarEvent(crmSystemKey?: ECRMSystem) {
    this.taskEditorApiService.calendarEventType
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: ICalendarEventType[]) => {
        this.events = res.map((item) => {
          return {
            ...item,
            label: this.titleCasePipe.transform(item?.label)
          };
        });
      });
  }

  public get formData() {
    return this.scheduleReminderForm;
  }

  public updateValueAndValidity(): void {
    this.scheduleReminderForm.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
