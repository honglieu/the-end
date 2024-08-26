import {
  ValidatorFn,
  AbstractControl,
  FormControl,
  ValidationErrors
} from '@angular/forms';
import { EMAIL_FORMAT_REGEX } from '@services/constants';

export class ShareValidators {
  static containsLineBreak(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const input = control.value as string;
      if (
        input &&
        !input.trim() &&
        (input.includes('\n') || input.includes(' '))
      ) {
        return { containsLineBreakAndSpace: true };
      }
      return null;
    };
  }

  // custom validation check empty value (only space) in input field value
  static trimValidator(control: FormControl) {
    const value = control.value;
    if (value && typeof value === 'string') {
      const trimmedValue = value.trim()?.length;
      if (!trimmedValue) {
        return { required: true };
      }
    }
    return null;
  }

  static greaterThanZero(control: FormControl) {
    const value = control.value;
    if (!value || value <= 0) {
      return { invalid: true };
    }
    return null;
  }

  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const phoneNumberRegex = /^\d{10}$/;

      if (control?.value && !phoneNumberRegex.test(control?.value)) {
        return { invalidPhoneNumber: true };
      }

      if ((control?.dirty || control?.touched) && control?.value === '') {
        return { required: true };
      }

      return null;
    };
  }

  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control?.value;
      if (!email) return null;
      const hasInvalidEmail = !EMAIL_FORMAT_REGEX.test(email);
      if (hasInvalidEmail) {
        return { invalidEmail: true };
      }
      return null;
    };
  }

  static websiteUrl(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const urlRegex = /^(https?:\/\/)?[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}/;

      if (control.value && !urlRegex.test(control.value)) {
        return { invalidUrl: true };
      }
      return null;
    };
  }
}
