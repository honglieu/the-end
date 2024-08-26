import {
  Component,
  ContentChild,
  Input,
  AfterContentInit
} from '@angular/core';
import {
  AbstractControl,
  FormControlDirective,
  FormControlName,
  NgControl
} from '@angular/forms';

export interface IErrorValidateType {
  errorName: string;
  errorMessage: string;
}

@Component({
  selector: 'trudi-form-control',
  templateUrl: './trudi-form-control.component.html',
  styleUrls: ['./trudi-form-control.component.scss']
})
export class TrudiFormControlComponent implements AfterContentInit {
  @ContentChild(NgControl, { static: false }) defaultValidateControl?:
    | FormControlName
    | FormControlDirective;

  @Input() control: AbstractControl | null = null;
  @Input() errors: IErrorValidateType[] | null = null;
  // TODO: optimize later
  @Input() checkSubmit: boolean = false;
  @Input() checkDirty: boolean = false;
  @Input() showErrorMessage: boolean = true;

  constructor() {}

  get errorMessage(): string {
    if (this.control) {
      if (this.errors) {
        const error = this.errors.find((error: IErrorValidateType) =>
          this.control?.hasError(error.errorName)
        );
        if (error) return error.errorMessage;
      }

      if (this.control.errors?.['required']) {
        return 'Required field';
      } else if (this.control.errors?.['minlength']) {
        const requiredLength = this.control.errors['minlength'].requiredLength;
        return `Should be at least ${requiredLength} characters long.`;
      } else if (this.control.errors?.['maxlength']) {
        const requiredLength = this.control?.errors['maxlength'].requiredLength;
        return `Should not exceed ${requiredLength} characters.`;
      } else if (this.control.errors?.['invalidRangeTime']) {
        return 'Start time must be earlier than end time';
      }
      if (this.control.errors) {
        const keyError = Object.keys(this.control.errors)[0];
        return (
          this.control.errors[keyError]?.message || keyError + 'is invalid!'
        );
      }
    }

    return '';
  }

  ngAfterContentInit(): void {
    if (!this.control && this.defaultValidateControl) {
      this.control = this.defaultValidateControl.control;
    }
  }
}
