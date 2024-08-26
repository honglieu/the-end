import { Component, OnInit } from '@angular/core';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'conversation-file',
  templateUrl: './conversation-file.component.html',
  styleUrls: ['./conversation-file.component.scss']
})
export class ConversationFileComponent implements OnInit {
  public conversationFileForm: FormGroup;
  constructor(
    private communicationStepFormService: CommunicationStepFormService
  ) {}
  ngOnInit(): void {
    this.conversationFileForm = this.communicationStepFormService
      .getCustomForm as FormGroup;
  }
  public get formData(): FormGroup {
    return this.conversationFileForm;
  }
  public updateValueAndValidity(): void {
    this.conversationFileForm.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationStepFormService.isSubmittedCommunicationForm;
  }
}
