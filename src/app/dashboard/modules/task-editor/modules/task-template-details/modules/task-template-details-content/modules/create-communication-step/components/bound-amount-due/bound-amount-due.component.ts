import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'bound-amount-due',
  templateUrl: './bound-amount-due.component.html',
  styleUrls: ['./bound-amount-due.component.scss']
})
export class BoundAmountDueComponent implements OnInit {
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
