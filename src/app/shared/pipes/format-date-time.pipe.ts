import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, map } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Pipe({
  name: 'formatDateTime'
})
export class FormatDateTimePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(
    value: string,
    isCustom: boolean = false,
    includeAbbrev: boolean = false,
    isCustomV2: boolean = false
  ): Observable<string> {
    return combineLatest([
      this.agencyDateFormatService.dateAndTimeFormatDayjs$,
      this.agencyDateFormatService.dateAndTimeFormat$,
      this.agencyDateFormatService.dateAndTimeFormatV2$,
      this.agencyDateFormatService.timezone$
    ]).pipe(
      map(
        ([
          dateTimeFormat,
          dateTimeCustomFormat,
          dateTimeCustomFormatV2,
          timezoneObj
        ]) => {
          if (!value) return '';

          const data = dayjs(value).tz(timezoneObj.value);
          let format = dateTimeFormat;
          if (isCustom) {
            format = dateTimeCustomFormat;
          }

          if (isCustomV2) {
            format = dateTimeCustomFormatV2;
          }

          if (includeAbbrev) {
            format = `${format.substring(0, 7)} ([${
              timezoneObj.abbrev
            }])${format.substring(7)}`;
          }
          return data.format(format);
        }
      )
    );
  }
}
