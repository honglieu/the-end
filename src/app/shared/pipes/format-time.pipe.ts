import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, map } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

/**
 * @usage
 * ```
 * <span> {{ value | formatTime | async }}
 * ```
 */

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(
    value: Date | string,
    isCustom?: boolean
  ): Observable<string> | string {
    return this.agencyDateFormatService.timezone$.pipe(
      map((timezoneObj) => {
        if (!value) return '';
        const date = dayjs(value).tz(timezoneObj?.value);
        if (isCustom) return date.format('hh:mm a');
        return date.format('HH:mm');
      })
    );
  }
}
