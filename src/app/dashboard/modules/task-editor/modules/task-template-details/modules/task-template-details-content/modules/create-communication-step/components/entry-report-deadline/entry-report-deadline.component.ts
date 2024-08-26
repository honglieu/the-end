import { Component, OnInit } from '@angular/core';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'entry-report-deadline',
  templateUrl: './entry-report-deadline.component.html',
  styleUrls: ['./entry-report-deadline.component.scss']
})
export class EntryReportDeadlineComponent implements OnInit {
  public form: FormGroup;

  constructor(private communicationFormService: CommunicationStepFormService) {}

  ngOnInit(): void {
    this.form = this.communicationFormService.getCustomForm as FormGroup;
  }

  public updateValueAndValidity(): void {
    this.form.updateValueAndValidity();
  }

  get isSubmittedCommunicationForm() {
    return this.communicationFormService.isSubmittedCommunicationForm;
  }
}
