import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Pipe, PipeTransform } from '@angular/core';
import { Observable, map } from 'rxjs';
@Pipe({
  name: 'formatDateTimeAbbrev'
})
export class FormatDateTimeAbbrevPipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  transform(
    _,
    needParenthese: boolean = false,
    needGmt: boolean = false
  ): Observable<string> {
    return this.agencyDateFormatService.timezone$.pipe(
      map((timezoneObj) => {
        return needParenthese
          ? `(${timezoneObj?.abbrev})`
          : needGmt
          ? timezoneObj?.abbrev + ' ' + timezoneObj?.gmt
          : timezoneObj?.abbrev;
      })
    );
  }
}
