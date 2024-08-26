import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, filter, map } from 'rxjs';
import { convertUTCToLocalDateTime } from '@core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Pipe({
  name: 'dateTimeString'
})
export class DateTimeStringPipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  transform(createAtTime: string): Observable<string> {
    return combineLatest([
      this.agencyDateFormatService.timezone$,
      this.agencyDateFormatService.dateFormat$
    ]).pipe(
      filter(Boolean),
      map(([tz, dateFormat]) => {
        const createdAt = dayjs(
          convertUTCToLocalDateTime(createAtTime, tz.value)
        );
        const now = new Date();
        const currentDate = dayjs(convertUTCToLocalDateTime(now, tz.value));
        const yesterday = currentDate.clone().subtract(1, 'day');

        if (createdAt.isSame(currentDate, 'day')) {
          return 'Today';
        }
        if (createdAt.isSame(yesterday, 'day')) {
          return 'Yesterday';
        }
        return (
          createdAt.format(dateFormat.DATE_FORMAT_FULL)?.toUpperCase() || ''
        );
      })
    );
  }
}
