import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'capture-amount-owing-to-vacate',
  templateUrl: './capture-amount-owing-to-vacate.component.html',
  styleUrls: ['./capture-amount-owing-to-vacate.component.scss']
})
export class CaptureAmountOwingToVacateComponent implements OnInit, OnDestroy {
  public destroy$ = new Subject<void>();
  public form: FormGroup;
  public ECRMSystem = ECRMSystem;
  public currentCRM = ECRMSystem.PROPERTY_TREE;
  constructor(
    private communicationFormService: CommunicationStepFormService,
    private taskTemplateService: TaskTemplateService
  ) {}

  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentCRM = res.crmSystemKey;
      });
    this.form = this.communicationFormService.getCustomForm as FormGroup;
  }

  public updateValueAndValidity(): void {
    this.form.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationFormService.isSubmittedCommunicationForm;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
