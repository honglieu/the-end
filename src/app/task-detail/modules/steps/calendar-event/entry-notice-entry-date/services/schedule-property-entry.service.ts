import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SchedulePropertyService {
  public entryForm: FormGroup;
  constructor(private fb: FormBuilder, private apiService: ApiService) {}

  buildEntryForm() {
    this.entryForm = this.fb.group({
      reasonSelected: [null, Validators.required],
      typeReason: [null],
      dateOfEntry: [null, Validators.required],
      timeOfEntry: ['', Validators.required]
    });
  }

  clearValidationFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item.clearValidators();
      item.updateValueAndValidity();
    });
  }

  setValidationTypeReasonField(field: AbstractControl) {
    field.setValidators([Validators.required, Validators.maxLength(50)]);
    field.updateValueAndValidity();
  }

  setMarkAsTouchedFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item.markAsTouched();
      item.updateValueAndValidity();
    });
  }

  setMarkAsUnTouchedFields(fields: AbstractControl[]) {
    fields.forEach((item) => {
      item?.markAsPristine();
      item?.markAsUntouched();
      item?.updateValueAndValidity();
    });
  }

  resetForm() {
    this.entryForm?.reset({
      reasonSelected: null,
      typeReason: null,
      dateOfEntry: null,
      timeOfEntry: null
    });
  }
}
