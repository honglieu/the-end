import { PASSWORD_PATTERN } from './../../services/constants';
import { ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';

export class UserProfileValidators {
  static confirmPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const form = control.parent;
      const newPassword = form ? form.get('newPassword') : null;
      const confirmPassword = form ? form.get('confirmNewPassword') : null;

      if (newPassword?.value && confirmPassword?.value) {
        return newPassword?.value === confirmPassword?.value
          ? null
          : { isNotSame: true };
      }
      return null;
    };
  }

  static validPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      if (control.value) {
        return PASSWORD_PATTERN.test(control.value)
          ? null
          : { isInValidPassword: true };
      }
      return null;
    };
  }
}
