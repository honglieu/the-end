import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class BreachNoticeFormService {
  public breachNoticeForm: FormGroup;
  public breachNoticeTenancyForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}

  buildForm(): void {
    this.breachNoticeForm = this.formBuilder.group({
      noteType: new FormControl('', [Validators.required]),
      saveTo: new FormControl('', [Validators.required]),
      tenancy: new FormControl(''),
      tenancyNote: new FormControl('', [Validators.required])
    });
    this.breachNoticeTenancyForm = this.formBuilder.group({
      tenancy: new FormControl('', [Validators.required])
    });
  }

  resetForm(fields: string[]) {
    for (let field of fields) {
      const form = this[field] as FormGroup;
      form.reset();
      form.markAsPristine();
      form.markAsUntouched();
      form.updateValueAndValidity();
    }
  }

  resetAllForm() {
    this.resetForm(['breachNoticeForm', 'breachNoticeTenancyForm']);
  }
}
