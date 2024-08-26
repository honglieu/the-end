import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'capture-conditions-for-request-approval',
  templateUrl: './capture-conditions-for-request-approval.component.html',
  styleUrls: ['./capture-conditions-for-request-approval.component.scss']
})
export class CaptureConditionsForRequestApprovalComponent implements OnInit {
  constructor(
    private communicationStepFormService: CommunicationStepFormService
  ) {}

  ngOnInit(): void {}

  public get formData(): FormGroup {
    return this.communicationStepFormService.getCustomForm as FormGroup;
  }

  public updateValueAndValidity(): void {
    this.formData.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationStepFormService.isSubmittedCommunicationForm;
  }
}
