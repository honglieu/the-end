import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, map } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

/**
 * @usage
 * ```
 * <span> {{ value | formatCharectorDate | async }}
 * ```
 */
@Pipe({ name: 'formatCharectorDate' })
export class FormatCharectorDatePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(value: Date | string): Observable<string> | string {
    return combineLatest([
      this.agencyDateFormatService.dateFormatCharector$,
      this.agencyDateFormatService.timezone$
    ]).pipe(
      map(([dateFormat, timezoneObj]) => {
        if (!value) return '';
        return dayjs(value).tz(timezoneObj?.value).format(dateFormat);
      })
    );
  }
}
