import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import dayjs from 'dayjs';

export class TenantRecurringChargeForm extends FormGroup {
  constructor(
    isException = false,
    id = undefined,
    charge = undefined,
    type = undefined,
    amount = undefined,
    comment = undefined,
    frequency = undefined,
    fromDate = undefined,
    toDate = undefined,
    calculation = undefined
  ) {
    super({
      isException: new FormControl(isException),
      id: new FormControl({ value: id, disabled: false }),
      charge: new FormControl({ value: charge, disabled: false }),
      type: new FormControl(
        { value: type, disabled: false },
        Validators.required
      ),
      amount: new FormControl(amount, validateAmountFn()),
      comment: new FormControl({ value: comment, disabled: false }),
      frequency: new FormControl(
        { value: frequency, disabled: false },
        recurringChargeDateValidator('', 'frequency')
      ),
      fromDate: new FormControl(
        fromDate,
        recurringChargeDateValidator(
          'From date must be prior to the to date',
          'fromDate'
        )
      ),
      toDate: new FormControl(
        toDate,
        recurringChargeDateValidator(
          'To date must be after the from date',
          'toDate'
        )
      ),
      calculation: new FormControl({ value: calculation, disabled: false })
    });
  }
}

export class TenantOneTimeChargeForm extends FormGroup {
  constructor(
    id = undefined,
    type = undefined,
    amount = undefined,
    comment = undefined,
    date = undefined,
    reference = undefined
  ) {
    super({
      id: new FormControl({ value: id, disabled: false }),
      type: new FormControl(
        { value: type, disabled: false },
        Validators.required
      ),
      amount: new FormControl(amount, validateAmountFn()),
      comment: new FormControl({ value: comment, disabled: false }),
      date: new FormControl({ value: date, disabled: false }, [
        Validators.required
      ]),
      reference: new FormControl({ value: reference, disabled: false })
    });
  }
}

export function validateAmountFn(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
    const amount = control.value;
    if (!amount) return null;
    if (!Number.isNaN(amount)) {
      if (amount >= 0 && amount < 1000000000) {
        return null;
      }
    } else {
      const testNumber = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/;
      const hasInvalidNumber = testNumber.test(amount);
      if (!hasInvalidNumber) {
        return {
          invalidNumber: {
            message: 'Invalid number'
          }
        };
      }
    }
    return null;
  };
}

export function recurringChargeDateValidator(
  message: string,
  formName: string
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control) {
      return null;
    }

    const frequencyControl = control.parent?.controls?.['frequency'];
    const fromDateControl = control.parent?.controls?.['fromDate'];
    const endDateControl = control.parent?.controls?.['toDate'];

    const frequency = frequencyControl?.value;
    const fromDate = fromDateControl?.value;
    const endDate = endDateControl?.value;

    if (fromDate && endDate && formName !== 'frequency')
      if (
        dayjs(fromDate).startOf('day').isAfter(dayjs(endDate).startOf('day')) ||
        (endDate && !fromDate)
      ) {
        return {
          invalidDate: { message: message }
        };
      }
    fromDateControl?.setErrors(null);
    endDateControl?.setErrors(null);

    if (frequency > 1 && !fromDate) {
      if (formName === 'fromDate') return { required: true };
      else fromDateControl?.setErrors({ required: true });
    } else {
      if (formName === 'fromDate') return null;
      else fromDateControl?.setErrors(null);
    }

    return null;
  };
}

export enum EChargeTypes {
  ONE_TIME_CHARGES = 'oneTime',
  RECURRING_CHARGES = 'recurring'
}
