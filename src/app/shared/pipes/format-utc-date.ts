import { Observable, map } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

/**
 * @usage
 * ```
 * <span> {{ value | formatUTCDate | async }}
 * ```
 */

@Pipe({ name: 'formatUTCDate' })
export class FormatUTCDatePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(str: string): Observable<string> {
    return this.agencyDateFormatService.dateFormatDayJS$.pipe(
      map((formatDate) => {
        if (!str) return '';
        return dayjs(str).utc().format(formatDate);
      })
    );
  }
}
