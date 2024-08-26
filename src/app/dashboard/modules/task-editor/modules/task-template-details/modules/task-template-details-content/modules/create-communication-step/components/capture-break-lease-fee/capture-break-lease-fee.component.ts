import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'capture-break-lease-fee',
  templateUrl: './capture-break-lease-fee.component.html',
  styleUrls: ['./capture-break-lease-fee.component.scss']
})
export class CaptureBreakLeaseFeeComponent implements OnInit {
  public form: FormGroup;
  constructor(
    private communicationStepFormService: CommunicationStepFormService
  ) {}
  ngOnInit(): void {
    this.form = this.communicationStepFormService.getCustomForm as FormGroup;
  }

  public updateValueAndValidity(): void {
    this.form.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationStepFormService.isSubmittedCommunicationForm;
  }
}
