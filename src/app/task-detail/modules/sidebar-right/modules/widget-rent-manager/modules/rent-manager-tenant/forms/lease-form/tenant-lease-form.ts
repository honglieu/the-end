import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

const dateRangeValidator = (
  keyStartDate: string,
  keyEndDate: string,
  message: string
): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control) {
      return null;
    }
    const startDate = control.parent?.controls[keyStartDate]?.value;
    const endDate = control.parent?.controls[keyEndDate]?.value;
    control.parent?.controls[keyStartDate].setErrors(null);
    control.parent?.controls[keyEndDate].setErrors(null);

    if (!startDate && endDate) {
      control.parent?.controls[keyStartDate]?.setErrors({ required: true });
      if (control === control.parent?.controls[keyStartDate])
        return { required: true };
    }
    if (startDate && endDate) {
      const startTime = new Date(startDate).setHours(0, 0, 0, 0);
      const endTime = new Date(endDate).setHours(0, 0, 0, 0);
      const isValidDate = endTime >= startTime;
      if (!isValidDate) {
        return {
          invalidDate: { message: message }
        };
      }
      control.parent?.controls[keyStartDate].setErrors(null);
      control.parent?.controls[keyEndDate].setErrors(null);
    }
    return null;
  };
};
export class TenantLeaseForm extends FormGroup {
  constructor() {
    super({
      moveInDate: new FormControl({ value: undefined, disabled: false }, [
        dateRangeValidator(
          'moveInDate',
          'moveOutDate',
          'Move in date must be prior to the move out date'
        )
      ]),
      moveOutDate: new FormControl({ value: undefined, disabled: false }, [
        dateRangeValidator(
          'moveInDate',
          'moveOutDate',
          'Move out date must be after the move in date'
        )
      ]),
      noticeDate: new FormControl({ value: undefined, disabled: false }),
      expectedMoveOutDate: new FormControl({
        value: undefined,
        disabled: false
      }),
      startDate: new FormControl({ value: undefined, disabled: false }, [
        dateRangeValidator(
          'startDate',
          'endDate',
          'Start date must be prior to the end date'
        )
      ]),
      endDate: new FormControl({ value: undefined, disabled: false }, [
        dateRangeValidator(
          'startDate',
          'endDate',
          'End date must be after the start date'
        )
      ]),
      signDate: new FormControl({ value: undefined, disabled: false }),
      term: new FormControl({ value: undefined, disabled: false })
    });
  }
}
