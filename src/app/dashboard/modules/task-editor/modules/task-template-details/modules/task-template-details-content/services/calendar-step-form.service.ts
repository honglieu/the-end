import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICalendarEventStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConflictStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class CalendarStepFormService {
  private calendarForm: FormGroup;
  private currentStepData: BehaviorSubject<ICalendarEventStep> =
    new BehaviorSubject(null);
  public currentStepData$ = this.currentStepData.asObservable();
  constructor(private formBuilder: FormBuilder) {}

  public buildForm(data?: ICalendarEventStep) {
    if (!data) {
      this.calendarForm = this.formBuilder.group({
        stepName: ['', [Validators.required]],
        eventType: ['', [Validators.required]],
        isRequired: []
      });
    } else {
      const tempData = data ? this.handleCrmConflict(cloneDeep(data)) : data;
      const { stepName, eventType, isRequired } = tempData?.fields || {};
      this.calendarForm = this.formBuilder.group({
        stepName: [stepName, [Validators.required]],
        eventType: [eventType, [Validators.required]],
        isRequired: [isRequired]
      });
    }
    return this.calendarForm;
  }

  public get calendarEventForm(): FormGroup {
    return this.calendarForm;
  }

  public getFormData() {
    this.calendarEventForm.value;
  }

  public setCurrentStepData(data: ICalendarEventStep) {
    this.currentStepData.next(data);
  }

  private handleCrmConflict(data: ICalendarEventStep) {
    const { fields, crmConflictErrors = [] } = data || {};

    if (crmConflictErrors.find((x) => x.type === ConflictStepType.EVENT)) {
      fields.eventType = null;
    }

    return data;
  }
}
