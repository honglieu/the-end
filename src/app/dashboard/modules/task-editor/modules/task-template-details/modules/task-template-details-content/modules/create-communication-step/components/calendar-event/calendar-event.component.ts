import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ICalendarEventType } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';

@Component({
  selector: 'calendar-event',
  templateUrl: './calendar-event.component.html',
  styleUrls: ['./calendar-event.component.scss']
})
export class CalendarEventComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  public visible: boolean = true;
  public calendarEvents = [];
  public calendarEventForm: FormGroup;
  public disabled = false;
  private destroy$ = new Subject<void>();

  constructor(
    private communicationFormService: CommunicationStepFormService,
    private agencyService: AgencyService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorApiService: TaskEditorApiService
  ) {}

  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.subscribeCalendarEvent(res.crmSystemKey);
      });

    this.calendarEventForm = this.communicationFormService
      .getCustomForm as FormGroup;
  }

  subscribeCalendarEvent(crmSystemKey?: ECRMSystem) {
    this.taskEditorApiService.calendarEventType
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: ICalendarEventType[]) => {
        this.calendarEvents = res;
      });
  }

  ngAfterViewInit() {
    this.disabled = true;
  }

  public get formData(): FormGroup {
    return this.calendarEventForm;
  }

  public updateValueAndValidity(): void {
    this.calendarEventForm.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
