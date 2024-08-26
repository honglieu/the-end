import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'dayLeft'
})
export class DayLeftPipe implements PipeTransform {
  transform(startDateValue, endDateValue) {
    if (startDateValue && endDateValue) {
      const startDate = dayjs(startDateValue);
      const endDate = dayjs(endDateValue);
      const dayLeft = endDate.diff(startDate, 'day');
      return dayLeft > 1 ? dayLeft + ' days' : dayLeft + ' day';
    } else {
      return 0;
    }
  }
}
