import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, map } from 'rxjs';
import { convertUTCToLocalDateTime } from '@core/time/timezone.helper';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from '@services/constants';
import { EPage } from '@shared/enum/trudi';
/**
 * @usage
 * ```
 * <span>{{ value | trudiDateTime | async }} </span>
 * ```
 */
@Pipe({ name: 'trudiDateTime' })
export class TrudiDateTimePipe implements PipeTransform {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  public transform(
    dateStr: string,
    pageType: EPage = EPage.INDEX,
    isShowYesterday: boolean = true,
    isShowDateTime: false
  ): Observable<string> {
    return combineLatest([
      this.agencyDateFormatService.dateFormatDayJS$,
      this.agencyDateFormatService.timezone$
    ]).pipe(
      map(([dateFormat, timezoneObj]) => {
        if (!!dateStr) {
          const givenDate = dayjs(
            convertUTCToLocalDateTime(new Date(dateStr), timezoneObj.value)
          );
          const currentDate = dayjs(
            convertUTCToLocalDateTime(new Date(), timezoneObj.value)
          );
          const yesterday = currentDate.clone().subtract(1, 'day');

          const isToday = givenDate.isSame(currentDate, 'day');
          const isYesterday = givenDate.isSame(yesterday, 'day');
          const timeString = givenDate.format(TIME_FORMAT);

          if (isToday && !isShowDateTime) return timeString;
          if (isToday && isShowDateTime) return `Today, ${timeString}`;
          if (isYesterday && isShowYesterday) {
            return pageType === EPage.DETAILS
              ? `${timeString} yesterday`
              : isShowDateTime
              ? `Yesterday, ${timeString}`
              : 'Yesterday';
          }
          if (isShowDateTime)
            return `${givenDate.format(dateFormat)}`.trim() + `, ` + timeString;

          return `${
            pageType === EPage.DETAILS ? timeString : ''
          } ${givenDate.format(dateFormat)}`.trim();
        }
        return '';
      })
    );
  }
}
