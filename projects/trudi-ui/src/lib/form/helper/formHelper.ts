import { FormArray, FormControl, FormGroup } from '@angular/forms';

export class FormHelper {
  static markGroupDirty(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      switch (formGroup.get(key).constructor.name) {
        case 'FormGroup':
          this.markGroupDirty(formGroup.get(key) as FormGroup);
          break;
        case 'FormArray':
          this.markArrayDirty(formGroup.get(key) as FormArray);
          break;
        case 'FormControl':
          this.markControlDirty(formGroup.get(key) as FormControl);
          break;
      }
    });
  }

  static markArrayDirty(formArray: FormArray) {
    formArray.controls.forEach((control) => {
      switch (control.constructor.name) {
        case 'FormGroup':
          this.markGroupDirty(control as FormGroup);
          break;
        case 'FormArray':
          this.markArrayDirty(control as FormArray);
          break;
        case 'FormControl':
          this.markControlDirty(control as FormControl);
          break;
      }
    });
  }

  static markControlDirty(formControl: FormControl) {
    formControl.markAsDirty();
  }

  static resetFormControl(formControl: FormControl) {
    formControl.reset();
    formControl.markAsPristine();
    formControl.markAsUntouched();
  }

  static resetFormGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup) {
        this.resetFormGroup(control as FormGroup);
        return;
      }

      if (control instanceof FormArray) {
        this.resetFormArray(control as FormArray);
        return;
      }

      if (control instanceof FormControl) {
        this.resetFormControl(control as FormControl);
        return;
      }
    });
  }

  static resetFormArray(formArray: FormArray) {
    formArray.controls.forEach((control) => {
      if (control instanceof FormGroup) {
        this.resetFormGroup(control as FormGroup);
        return;
      }

      if (control instanceof FormArray) {
        this.resetFormArray(control as FormArray);
        return;
      }

      if (control instanceof FormControl) {
        this.resetFormControl(control as FormControl);
        return;
      }
    });
  }
}
