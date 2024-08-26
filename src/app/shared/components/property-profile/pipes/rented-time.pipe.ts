import { Pipe, PipeTransform } from '@angular/core';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

dayjs.extend(relativeTime);

@Pipe({
  name: 'rentedTime'
})
export class RentedTimePipe implements PipeTransform {
  transform(value?: Date): string {
    return this._calculateAndFormatRentedDays(value);
  }

  private _calculateAndFormatRentedDays(originalLeaseDate?: Date) {
    if (!originalLeaseDate) {
      return '';
    }
    let differenceDay = dayjs().diff(originalLeaseDate, 'day');
    if (differenceDay <= 0) {
      return '';
    }
    let years = Math.floor(differenceDay / 365);
    differenceDay %= 365;
    let months = Math.floor(differenceDay / 30);
    differenceDay %= 30;
    let days = differenceDay;
    let rentedString = '';
    if (years > 0) {
      rentedString += `${years} ${years > 1 ? 'years' : 'year'} `;
    }
    if (months > 0) {
      rentedString += `${months} ${months > 1 ? 'months' : 'month'} `;
    }
    if (days > 0) {
      rentedString += `${days} ${days > 1 ? 'days' : 'day'}`;
    }
    if (rentedString === '') {
      return '';
    }
    return `(${rentedString.trim()})`;
  }
}
