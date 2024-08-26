import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'application-shortlist',
  templateUrl: './application-shortlist.component.html',
  styleUrls: ['./application-shortlist.component.scss']
})
export class ApplicationShortlistComponent implements OnInit {
  public applicationShortlistForm: FormGroup;
  constructor(
    private communicationStepFormService: CommunicationStepFormService
  ) {}

  ngOnInit(): void {
    this.applicationShortlistForm = this.communicationStepFormService
      .getCustomForm as FormGroup;
  }

  public updateValueAndValidity(): void {
    this.applicationShortlistForm.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationStepFormService.isSubmittedCommunicationForm;
  }
}
