import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { combineLatest, map, Observable } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

/**
 * @usage
 * ```
 * <span> {{ value | formatDate | async }}
 * ```
 */
@Pipe({ name: 'formatDate' })
export class FormatDatePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  transform(
    value: Date | string,
    excludeTimezone: boolean = false
  ): Observable<string> {
    return combineLatest([
      this.agencyDateFormatService.dateFormatDayJS$,
      this.agencyDateFormatService.timezone$
    ]).pipe(
      map(([dateFormat, timezoneObj]) => {
        if (!value) return '';
        const isShortDate = typeof value === 'string' && !value.includes('Z');
        if (excludeTimezone || isShortDate)
          return dayjs(value).format(dateFormat);
        return dayjs(value).tz(timezoneObj?.value).format(dateFormat);
      })
    );
  }
}
