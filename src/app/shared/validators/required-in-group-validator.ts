import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export const requiredInGroup = (pairControlNames: string[]): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors => {
    const controls = pairControlNames.map((name) => control.get(name));

    const someControlsHaveValue = controls.some((control) => control.value);

    if (someControlsHaveValue) {
      controls.forEach((control) => {
        if (!control.value) {
          const errors = control.errors || {};
          control.setErrors({ ...errors, required: true });
        } else {
          const errors = control.errors || {};
          delete errors['required'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      });
    } else {
      controls.forEach((control) => {
        const errors = control.errors || {};
        delete errors['required'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      });
    }

    return null;
  };
};
