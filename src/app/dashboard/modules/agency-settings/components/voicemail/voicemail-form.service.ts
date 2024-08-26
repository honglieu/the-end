import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { daysOfWeek } from '@/app/dashboard/modules/agency-settings/utils/constants';
import { VoicemailService } from './voicemail.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Injectable({
  providedIn: 'root'
})
export class VoicemailFormService {
  voicemailForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private voicemailService: VoicemailService,
    private agencyService: AgencyService
  ) {}

  buildVoicemailForm() {
    this.voicemailForm = this.formBuilder.group({
      redirectNumber: this.formBuilder.control('', [
        Validators.required,
        this.validateNumber.bind(this)
      ]),
      customiseVoicemail: this.formBuilder.control(''),
      days: this.formBuilder.array(
        daysOfWeek.map(() => this.createDayFormGroup())
      )
    });
  }

  createDayFormGroup() {
    return this.formBuilder.group({
      startTime: [''],
      endTime: ['']
    });
  }

  validateNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.replace(/[()\s\-]/g, '');
    const agencyVoicemailPhoneNumber =
      this.voicemailService.voicemailSettingValue?.company
        ?.voiceMailPhoneNumber;

    if (!value) {
      return null;
    }
    const minLength = this.agencyService.getPhoneNumberMinLength.value;
    if (value.length < minLength) {
      return { invalidNumber: true };
    }

    if (value === agencyVoicemailPhoneNumber) {
      return { duplicated: true };
    }

    return null;
  }
}
