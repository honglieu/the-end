import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ISettingConfig } from '@/app/dashboard/modules/insights/interfaces/insights.interface';

@Injectable({
  providedIn: 'root'
})
export class InsightsFormService {
  public insightSettingsFormGroup: FormGroup;
  constructor(private fb: FormBuilder) {}
  buildForm() {
    this.insightSettingsFormGroup = this.fb.group({
      emailToCustomer: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.commonMaxIntegerPartValidator()
        ]
      ],
      phoneCall: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.commonMaxIntegerPartValidator()
        ]
      ],
      translateEmail: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.commonMaxIntegerPartValidator()
        ]
      ],
      aiAssistant: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.commonMaxIntegerPartValidator()
        ]
      ],
      fulltimeWork: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.commonMaxIntegerPartValidator()
        ]
      ],
      propertiesNational: [
        '',
        [
          Validators.required,
          this.commonFormValidatorNumber(),
          this.companyAverageMaxIntegerPartValidator()
        ]
      ]
    });
    return this.insightSettingsFormGroup;
  }

  generateInsightSettingPayload() {
    return {
      EMAIL_TO_CUSTOMER: {
        value: this.getValueOfFormControl('emailToCustomer'),
        unit: 'minutes'
      },
      PHONE_CALL: {
        value: this.getValueOfFormControl('phoneCall'),
        unit: 'minutes'
      },
      TRANSLATE_EMAIL: {
        value: this.getValueOfFormControl('translateEmail'),
        unit: 'minutes'
      },
      AI_ASSISTANT: {
        value: this.getValueOfFormControl('aiAssistant'),
        unit: 'minutes'
      },
      FULL_TIME_WORK: {
        value: this.getValueOfFormControl('fulltimeWork'),
        unit: 'hours'
      },
      PROPERTIES_NATIONAL: {
        value: this.getValueOfFormControl('propertiesNational'),
        unit: 'properties'
      }
    };
  }

  getListFormControlNames(): string[] {
    return Object.keys(this.insightSettingsFormGroup.getRawValue());
  }

  getValueOfFormControl(controlName: string) {
    return +this.insightSettingsFormGroup.controls[controlName].value;
  }

  commonFormValidatorNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== '' && +control.value <= 0) {
        return {
          positiveNumber: true
        };
      }
      return null;
    };
  }

  commonMaxIntegerPartValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (Math.floor(+control.value) > 99) {
        return { integerPart: true };
      }
      return null;
    };
  }

  companyAverageMaxIntegerPartValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (Math.floor(+control.value) > 999) {
        return { companyAverage: true };
      }
      return null;
    };
  }

  handlePatchFormSetting(SettingConfig: ISettingConfig) {
    this.insightSettingsFormGroup.patchValue({
      emailToCustomer: SettingConfig.EMAIL_TO_CUSTOMER.value + '',
      phoneCall: SettingConfig.PHONE_CALL.value + '',
      translateEmail: SettingConfig.TRANSLATE_EMAIL.value + '',
      aiAssistant: SettingConfig.AI_ASSISTANT.value + '',
      fulltimeWork: SettingConfig.FULL_TIME_WORK.value + '',
      propertiesNational: SettingConfig.PROPERTIES_NATIONAL.value + ''
    });
  }
}
