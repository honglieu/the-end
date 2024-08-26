import { Inject, Pipe, PipeTransform } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TRUDI_DATE_FORMAT } from '../provider';
import { ITimezone } from '../utils';
import { TrudiDateFormat } from '../interfaces';
@Pipe({
  name: 'formatDateTimeAbbrev',
  standalone: true
})
export class TrudiFormatDateTimeAbbrevPipe implements PipeTransform {
  constructor(@Inject(TRUDI_DATE_FORMAT) private trudiDateFormat: TrudiDateFormat) {}
  transform(
    _,
    needParenthese: boolean = false,
    needGmt: boolean = false
  ): Observable<string> {
    return this.trudiDateFormat.timezone$.pipe(
      map((timezoneObj: ITimezone) => {
        return needParenthese
          ? `(${timezoneObj?.abbrev})`
          : needGmt
          ? timezoneObj?.abbrev + ' ' + timezoneObj?.gmt
          : timezoneObj?.abbrev;
      })
    );
  }
}
