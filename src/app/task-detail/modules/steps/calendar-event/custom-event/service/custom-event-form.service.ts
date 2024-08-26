import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ShareValidators } from '@shared/validators/share-validator';
@Injectable({
  providedIn: 'root'
})
export class CustomEventFormService {
  public customEventForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}
  public buildForm() {
    this.customEventForm = this.formBuilder.group({
      reason: new FormControl(null, [
        Validators.required,
        ShareValidators.trimValidator
      ]),
      date: new FormControl(null, [Validators.required]),
      time: new FormControl(null, [Validators.required])
    });
  }
  public resetForm() {
    this.customEventForm.reset();
  }
}
