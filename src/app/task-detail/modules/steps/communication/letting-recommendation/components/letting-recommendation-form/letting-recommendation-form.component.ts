import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CURRENCYNUMBER } from '@services/constants';
import {
  FrequencyRental,
  LeasePeriodType
} from '@shared/types/trudi.interface';
import { ILettingRecommendationFormType } from '@/app/task-detail/modules/steps/communication/letting-recommendation/letting-recommendation.component';
import { IRadioButton } from '@trudi-ui';

@Component({
  selector: 'letting-recommendation-form',
  templateUrl: './letting-recommendation-form.component.html',
  styleUrls: ['./letting-recommendation-form.component.scss']
})
export class LettingRecommendationFormComponent implements OnInit {
  @Input() isRequired = false;
  @Input() prefillData: ILettingRecommendationFormType;
  public lettingForm: FormGroup;
  public radioListData: IRadioButton[] = [
    {
      label: 'New Letting',
      value: 1
    },
    {
      label: 'Relet',
      value: 2
    }
  ];
  public maskPattern = CURRENCYNUMBER;
  public leasePeriodTypeData = [
    {
      label: 'Weeks',
      value: LeasePeriodType.Weeks
    },
    {
      label: 'Months',
      value: LeasePeriodType.Months
    },
    {
      label: 'Years',
      value: LeasePeriodType.Years
    }
  ];

  public frequencyData = [
    {
      label: 'Per day',
      value: FrequencyRental.DAILY
    },
    {
      label: 'Per week',
      value: FrequencyRental.WEEKLY
    },
    {
      label: 'Per 2 weeks',
      value: FrequencyRental.WEEKLY2
    },
    {
      label: 'Per month',
      value: FrequencyRental.MONTHLY
    },
    {
      label: 'Per quarter',
      value: FrequencyRental.QUARTERLY
    },
    {
      label: 'Per year',
      value: FrequencyRental.YEARLY
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.buildForm(this.prefillData);
  }

  resetForm() {
    this.lettingForm.reset();
    this.lettingForm.markAsPristine();
    this.lettingForm.markAsUntouched();
    this.lettingForm.updateValueAndValidity();
  }

  private buildForm(formData?: ILettingRecommendationFormType) {
    this.lettingForm = new FormGroup({
      leasePeriod: new FormControl(
        formData?.leasePeriod ?? null,
        this.isRequired ? Validators.required : null
      ),
      rentAmount: new FormControl(
        formData?.rentAmount ?? null,
        this.isRequired ? [Validators.required] : null
      ),
      frequency: new FormControl(
        formData?.frequency ?? FrequencyRental.MONTHLY,
        this.isRequired ? Validators.required : null
      ),
      leaseDuration: new FormControl(
        formData?.leaseDuration ?? null,
        this.isRequired ? Validators.required : null
      ),
      leasePeriodType: new FormControl(
        formData?.leasePeriodType ?? LeasePeriodType.Months,
        this.isRequired ? Validators.required : null
      )
    });
  }

  handleSubmitForm() {
    this.lettingForm.markAllAsTouched();
    if (this.lettingForm.invalid) return;
    return this.lettingForm.value;
  }
}
