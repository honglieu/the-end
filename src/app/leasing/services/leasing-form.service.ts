import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subject } from 'rxjs';
import {
  LeasePeriodType,
  FrequencyRental
} from '@shared/types/trudi.interface';
import { requiredInGroup } from '@shared/validators/required-in-group-validator';

const NUMBER_OF_APPLICATIONS = 3;

@Injectable({
  providedIn: 'root'
})
export class LeasingFormService {
  resetFormEventsSubject = new Subject<boolean>();
  leaseTermForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  buildLandlordApplicationShortlist(isRequiredFirstApplication = true) {
    return this.formBuilder.array(
      Array(NUMBER_OF_APPLICATIONS)
        .fill(0)
        .map((_value, index) => {
          const validators =
            index === 0 && isRequiredFirstApplication
              ? [Validators.required]
              : [];
          const customValidator =
            index !== 0 || !isRequiredFirstApplication
              ? [requiredInGroup(['name', 'summary'])]
              : [];
          return this.formBuilder.group(
            {
              name: ['', validators],
              summary: ['', validators]
            },
            { validators: customValidator }
          );
        })
    );
  }

  buildLeaseTermForm(): void {
    this.leaseTermForm = new FormGroup({
      leasePeriod: new FormControl(null, Validators.required),
      leasePeriodType: new FormControl(
        LeasePeriodType.Months,
        Validators.required
      ),
      rentAmount: new FormControl(null, [
        Validators.required,
        this.validateAmount
      ]),
      frequency: new FormControl(FrequencyRental.MONTHLY, Validators.required),
      leaseDuration: new FormControl(null, Validators.required)
    });
  }

  validateAmount(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const numericValue = value.replace(/[^0-9.]/g, '');
    const [wholePart, decimalPart] = numericValue.split('.');

    if (
      wholePart.length > 12 ||
      decimalPart?.length > 2 ||
      parseFloat(numericValue) < 0 ||
      wholePart.length + decimalPart?.length > 12 ||
      numericValue[numericValue.length - 1] === '.'
    ) {
      return { invalidAmount: true };
    }

    return null;
  }
}
