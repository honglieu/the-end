import { ValidationErrors, AbstractControl } from '@angular/forms';
import dayjs from 'dayjs';

export const dateRangeValidator = (
  startDate?: dayjs.Dayjs,
  endDate?: dayjs.Dayjs
): ValidationErrors | null => {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const input = control.value as string;
    const invalidStartDate = startDate && dayjs(input).isBefore(startDate);
    const invalidEndDate = endDate && dayjs(input).isAfter(endDate);
    const invalid = input && (invalidStartDate || invalidEndDate);
    return invalid ? { dateRange: true } : null;
  };
};
