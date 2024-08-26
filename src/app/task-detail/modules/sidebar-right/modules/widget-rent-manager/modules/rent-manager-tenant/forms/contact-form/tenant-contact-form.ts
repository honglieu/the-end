import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { EMAIL_PATTERN } from '@services/constants';

const validateEmailFn = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors => {
    const email = control.value;
    if (!email) return null;
    const hasInvalidEmail = EMAIL_PATTERN.test(email);
    if (!hasInvalidEmail) {
      return { invalidEmail: true };
    }
    return null;
  };
};

export class TenantContactForm extends FormGroup {
  constructor(
    firstName?: string,
    lastName?: string,
    email?: string,
    phoneNumber?: string,
    applicantType?: string,
    isPrimary?: boolean,
    contactTypeId?: number,
    contactId?: string
  ) {
    super({
      firstName: new FormControl({ value: firstName, disabled: false }),
      lastName: new FormControl({ value: lastName, disabled: false }, [
        Validators.required
      ]),
      contactType: new FormControl({ value: contactTypeId, disabled: false }),
      email: new FormControl({ value: email, disabled: false }, [
        validateEmailFn()
      ]),
      phoneNumber: new FormControl({ value: phoneNumber, disabled: false }),
      applicantType: new FormControl(applicantType || 'Applicant'),
      isPrimary: new FormControl(isPrimary || false),
      contactId: new FormControl({ value: contactId, disabled: false })
    });
  }
}
