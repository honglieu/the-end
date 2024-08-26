import {
  AbstractControl,
  FormArray,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { EBillType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

export enum ERmIssueControlName {
  OPEN_DATE = 'openDate',
  OPEN_TIME = 'openTime',
  CLOSE_DATE = 'closeDate',
  CLOSE_TIME = 'closeTime'
}

function clearError(control: AbstractControl, errorName: string) {
  const errors = control?.errors;
  if (errors && errors[errorName]) {
    delete errors[errorName];
    control.setErrors(isEmpty(errors) ? null : errors);
  }
}

export function customValidatorRequire(
  dependencyControl: ERmIssueControlName
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control) return null;
    const value = control.value as string;
    const otherControl = control.parent?.get(dependencyControl);

    if (otherControl && !otherControl.value && value) {
      const controlOtherErrors = otherControl.errors
        ? {
            ...otherControl.errors,
            required: true
          }
        : { required: true };
      otherControl.setErrors(controlOtherErrors);
    } else if (otherControl) {
      clearError(otherControl, 'required');
    }

    if (!value && otherControl?.value) {
      return { required: true };
    }

    return null;
  };
}

export function validatorTime(
  formControlName: ERmIssueControlName
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control?.value as string;
    const parent = control?.parent?.value;

    const otherControlName =
      formControlName === ERmIssueControlName.OPEN_TIME
        ? ERmIssueControlName.CLOSE_TIME
        : ERmIssueControlName.OPEN_TIME;
    const otherControl = control?.parent?.get(otherControlName);

    if (!value && otherControl?.value) {
      otherControl.setErrors(null);
    }

    if (!value || !parent || !parent.openDate || !parent.closeDate) {
      return null;
    }

    const openDate = dayjs(parent.openDate);
    const closeDate = dayjs(parent.closeDate);

    let openTime = parent.openTime
      ? dayjs(parent.openTime + ' 01/01/1970')
      : null;
    let closeTime = parent.closeTime
      ? dayjs(parent.closeTime + ' 01/01/1970')
      : null;

    if (formControlName === ERmIssueControlName.OPEN_TIME) {
      openTime = dayjs(value + ' 01/01/1970');
    } else {
      closeTime = dayjs(value + ' 01/01/1970');
    }

    if (openTime && closeTime) {
      const invalidTime =
        closeDate.isSame(openDate, 'day') && !closeTime.isAfter(openTime);
      control.parent?.get(otherControlName)?.setErrors(null);

      if (invalidTime) {
        return { invalidTime: true };
      }
    }

    return null;
  };
}

export function validatorDate(
  dependencyControl: ERmIssueControlName
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.parent) {
      return null;
    }

    const value = control.value as string;
    const parent = control.parent;
    const openTimeControl = parent.get('openTime');
    const closeTimeControl = parent.get('closeTime');

    const otherControl = parent.get(dependencyControl);

    if (!value && otherControl && otherControl.value) {
      otherControl.setErrors(null);
    }

    if (openTimeControl.value && closeTimeControl.value) {
      clearError(openTimeControl, 'invalidTime');
      clearError(closeTimeControl, 'invalidTime');
    }

    if (value && otherControl && otherControl.value) {
      const openDate = dayjs(parent.get('openDate').value);
      const closeDate = dayjs(parent.get('closeDate').value);

      if (
        openTimeControl.value &&
        closeTimeControl.value &&
        closeDate.isSame(openDate, 'day')
      ) {
        const openTime = dayjs(openTimeControl.value + ' 01/01/1970');
        const closeTime = dayjs(closeTimeControl.value + ' 01/01/1970');
        if (!closeTime.isAfter(openTime)) {
          closeTimeControl.setErrors({ invalidTime: true });
        }
      }

      if (!closeDate.isSame(openDate, 'day') && closeDate.isBefore(openDate)) {
        otherControl.setErrors(null);
        return { invalidDate: true };
      } else {
        otherControl.setErrors(null);
      }
    }

    return null;
  };
}

export function setValidatorWhenSelectBill(
  formControlName: string
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control) return null;
    const billControll = control.parent?.get(formControlName);
    if (billControll) {
      const billControlValue = billControll.value as string[];
      const hasAnyRequiredType =
        billControlValue.includes(EBillType.PURCHASE_ORDER) ||
        billControlValue.includes(EBillType.VENDOR_BILL) ||
        billControlValue.includes(EBillType.OWNER_BILL);
      if (hasAnyRequiredType) {
        billControll.parent.controls['isAllowValidate'].setValue(true);
        billControll.parent.controls['vendorId'].setValidators([
          Validators.required
        ]);
        billControll.parent.controls['vendorId'].updateValueAndValidity();
        control.parent.markAllAsTouched();
      } else {
        billControll.parent.controls['vendorId'].setValidators(null);
        billControll.parent.controls['vendorId'].updateValueAndValidity();
      }
    }
    return null;
  };
}

export function prefillWorkOrderByFormControl(
  formControlName: string
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control) return null;
    const controlInfo = control.parent?.get(formControlName);
    if (
      control.parent?.get(formControlName).status === 'DISABLED' ||
      !controlInfo?.value
    ) {
      return null;
    }
    if (controlInfo && controlInfo.value) {
      const controlValue = controlInfo.value;
      const workOrderForm = control.parent?.parent.get(
        'workOrder'
      ) as FormArray;
      workOrderForm.controls.forEach((form) => {
        const controlUpdate = form.get(formControlName);
        controlUpdate.setValue(controlValue);
        controlUpdate.disable();
      });
    }
    return null;
  };
}
