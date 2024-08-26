import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'send-attachment',
  templateUrl: './send-attachment.component.html',
  styleUrls: ['./send-attachment.component.scss']
})
export class SendAttachmentComponent implements OnInit {
  public sendAttachmentForm: FormGroup;
  constructor(
    private communicationStepFormService: CommunicationStepFormService
  ) {}
  ngOnInit(): void {
    this.sendAttachmentForm = this.communicationStepFormService
      .getCustomForm as FormGroup;
  }

  public get formData(): FormGroup {
    return this.sendAttachmentForm;
  }

  public updateValueAndValidity(): void {
    this.sendAttachmentForm.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationStepFormService.isSubmittedCommunicationForm;
  }
}
