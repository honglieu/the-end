import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, map } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

/**
 * @usage
 * ```
 * <span> {{ value | formatCustomDate | async }}
 * ```
 */

@Pipe({
  name: 'formatCustomDate'
})
export class FormatCustomDatePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(
    value: Date | string,
    format: string = ''
  ): Observable<string> | string {
    return this.agencyDateFormatService.timezone$.pipe(
      map((timezoneObj) => {
        if (!value) return '';
        const date = dayjs(value).tz(timezoneObj?.value);
        return date.format(format);
      })
    );
  }
}
