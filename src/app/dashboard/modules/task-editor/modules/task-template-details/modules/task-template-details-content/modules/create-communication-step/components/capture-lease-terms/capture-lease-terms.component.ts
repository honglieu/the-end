import { Component, OnInit } from '@angular/core';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'capture-lease-terms',
  templateUrl: './capture-lease-terms.component.html',
  styleUrls: ['./capture-lease-terms.component.scss']
})
export class CaptureLeaseTermsComponent implements OnInit {
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
