import { Pipe, PipeTransform } from '@angular/core';
import { EEventType } from '@shared/enum';

@Pipe({ name: 'formatExpiredDate' })
export class FormatExpiredDatePipe implements PipeTransform {
  transform(expiredDate: number, eventType: EEventType): string {
    if (expiredDate === null || expiredDate === undefined) return '';
    if (expiredDate === 0 || expiredDate > 1) {
      return `in ${expiredDate} days`;
    }

    if (expiredDate < 1) {
      if (eventType === EEventType.AUTHORITY_START) return '';
      return 'expired';
    }

    if (expiredDate === 1) {
      return `in ${expiredDate} day`;
    }

    return '';
  }
}
