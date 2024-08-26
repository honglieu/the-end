import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';

@Component({
  selector: 'letting-recommendation',
  templateUrl: './letting-recommendation.component.html',
  styleUrls: ['./letting-recommendation.component.scss']
})
export class LettingRecommendationComponent implements OnInit {
  public form: FormGroup;
  public options = [
    {
      value: 0,
      label: 'New letting'
    },
    {
      value: 1,
      label: 'Relet'
    }
  ];

  constructor(private communicationFormService: CommunicationStepFormService) {}

  ngOnInit(): void {
    this.form = this.communicationFormService.getCustomForm as FormGroup;
  }

  get isDisabled() {
    return this.form.get('type').disabled;
  }

  get isSubmittedCommunicationForm() {
    return this.communicationFormService.isSubmittedCommunicationForm;
  }
}
