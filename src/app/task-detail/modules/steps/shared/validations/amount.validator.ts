import { ValidationErrors, AbstractControl } from '@angular/forms';

export const amountValidator = (
  control: AbstractControl
): ValidationErrors | null => {
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
};
