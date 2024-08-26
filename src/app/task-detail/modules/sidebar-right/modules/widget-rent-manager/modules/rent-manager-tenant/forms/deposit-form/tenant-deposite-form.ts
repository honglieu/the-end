import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

export const amountValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const amount = control.value;

  if (amount && amount <= 0) {
    return { invalidAmount: true };
  }

  return null;
};

export class TenantDepositeForm extends FormGroup {
  constructor() {
    super({
      type: new FormControl({ value: undefined, disabled: false }),
      amount: new FormControl({ value: undefined, disabled: false }, [
        amountValidator
      ]),
      date: new FormControl({ value: undefined, disabled: false }),
      isDepositPrior: new FormControl(false)
    });
  }
}
