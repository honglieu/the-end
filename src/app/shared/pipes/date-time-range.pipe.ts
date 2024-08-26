import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, map } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Pipe({
  name: 'dateTimeRange'
})
export class DateTimeRangePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(
    startTime: string,
    endTime: string,
    isEmptyResult?: boolean
  ): Observable<string> | string {
    return combineLatest([this.agencyDateFormatService.timezone$]).pipe(
      map(([timezoneObj]) => {
        if (startTime && endTime) {
          const timezone = timezoneObj?.value;
          const start = dayjs(startTime).tz(timezone).format('h:mm a');
          const end = dayjs(endTime).tz(timezone).format('h:mm a');
          return `${start} - ${end}`;
        } else {
          return isEmptyResult ? '' : 'All day';
        }
      })
    );
  }
}
