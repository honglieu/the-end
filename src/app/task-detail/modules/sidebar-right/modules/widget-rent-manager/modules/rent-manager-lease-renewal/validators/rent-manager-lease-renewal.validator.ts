import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { FrequencyRental } from '@shared/types/trudi.interface';

function clearError(control: AbstractControl, errorName: string) {
  const errors = control?.errors;
  if (errors && errors[errorName]) {
    delete errors[errorName];
    control.setErrors(isEmpty(errors) ? null : errors);
  }
}

export function dueDayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control) {
      return null;
    }
    const typeRentPeriod = control.parent?.controls['rentPeriod']?.value;
    if (typeRentPeriod != FrequencyRental.DAILY && !control.value)
      return { required: true };
    switch (typeRentPeriod) {
      case FrequencyRental.MONTHLY:
        if (+control.value < 1 || +control.value > 31)
          return {
            invalidDayOfMonth: { message: 'Due day must be between 1 and 31' }
          };
        break;
      default:
        break;
    }
    return null;
  };
}

export function dateRangeValidator(
  keyStartDate: string,
  keyEndDate: string,
  message: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control) {
      return null;
    }
    const startDate = control.parent?.controls[keyStartDate];
    const endDate = control.parent?.controls[keyEndDate];

    if (startDate && endDate) {
      if (!endDate.value) {
        clearError(startDate, 'invalidDate');
        return null;
      }

      if (startDate.value && endDate.value) {
        clearError(startDate, 'invalidDate');
        clearError(endDate, 'invalidDate');
      }

      if (
        dayjs(startDate.value)
          .startOf('day')
          .isAfter(dayjs(endDate.value).startOf('day')) ||
        (endDate.value && !startDate.value)
      ) {
        return {
          invalidDate: { message: message }
        };
      }
    }
    return null;
  };
}

export function recurringChargeValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control) {
      return null;
    }
    const value = control.value;
    if (parseFloat(value) > 999 || parseFloat(value) < 0) {
      return {
        invalidNumber: { message: 'The frequency must be between 0 and 999' }
      };
    }

    return null;
  };
}

export function validateAmountFn(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors => {
    const testNumber = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/;
    const amount = control.value;
    if (!amount) return null;
    const hasInvalidNumber = testNumber.test(amount);
    if (!hasInvalidNumber) {
      return {
        invalidNumber: {
          message: 'Invalid number'
        }
      };
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
    const fromDateControl = control.parent?.controls?.['from'];
    const endDateControl = control.parent?.controls?.['to'];

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
      if (formName === 'from') return { required: true };
      else fromDateControl?.setErrors({ required: true });
    } else {
      if (formName === 'from') return null;
      else fromDateControl?.setErrors(null);
    }

    return null;
  };
}
