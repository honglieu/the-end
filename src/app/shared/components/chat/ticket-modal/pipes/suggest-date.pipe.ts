import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'suggestDate'
})
export class SuggestDatePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  transform(message): string {
    let suggestedDate = '';
    if (!message) return '';
    if (message?.options.hasOwnProperty('response')) {
      const { availability } = message?.options?.response?.payload?.ticket;
      suggestedDate = availability ? this.formatDateRes(availability) : '';
      return suggestedDate;
    }
    suggestedDate = message?.options?.startTime
      ? this.formatDate(message?.options.startTime)
      : '';
    return suggestedDate;
  }

  formatDate(time: string, regex?: string) {
    return this.agencyDateFormatService.formatTimezoneDate(
      time,
      regex ??
        'dddd ' +
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
    );
  }

  formatDateRes(date: string) {
    return dayjs(date.split(' ')?.[0].substring(0, 19)).format(
      `dddd ${this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS}`
    );
  }
}
