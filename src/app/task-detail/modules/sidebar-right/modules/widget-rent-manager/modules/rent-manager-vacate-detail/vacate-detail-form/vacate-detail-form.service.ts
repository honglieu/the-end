import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

@Injectable()
export class FormVacateDetailService {
  private _form = new FormGroup({
    tenancyId: new FormControl(null, [Validators.required]),
    moveInDate: new FormControl(null, [
      Validators.required,
      this.dateRangeValidator(
        'moveInDate',
        'vacateDate',
        'Move in date must be prior to the move out date'
      )
    ]),
    vacateDate: new FormControl(null, [
      Validators.required,
      this.dateRangeValidator(
        'moveInDate',
        'vacateDate',
        'Move in date must after the move out date'
      )
    ]),
    noticeDate: new FormControl(null),
    expectedMoveOutDate: new FormControl(null)
  });

  get form() {
    return this._form;
  }

  public validate(): boolean {
    if (this._form.invalid) {
      this._form.markAllAsTouched();
      return false;
    }
    return true;
  }

  private dateRangeValidator(
    keyStartDate: string,
    keyEndDate: string,
    message: string
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control) {
        return null;
      }
      const startDate = control.parent?.controls[keyStartDate]?.value;
      const endDate = control.parent?.controls[keyEndDate]?.value;
      if (startDate && endDate) {
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        const endTime = new Date(endDate).setHours(0, 0, 0, 0);
        const isValidDate = endTime >= startTime;
        if (!isValidDate) {
          return {
            invalidDate: { message: message }
          };
        }
      }
      return null;
    };
  }
}
