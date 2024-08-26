import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  FormGroup,
  ValidatorFn
} from '@angular/forms';

//TODO: will replace form group in tenantForm
export class TenantFormGroup extends FormGroup {
  constructor(
    controls: {
      [key: string]: AbstractControl;
    },
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    super(controls, validatorOrOpts, asyncValidator);
  }

  public getForm(controlName: string) {
    // TODO: handle get recursive control name
  }
}
