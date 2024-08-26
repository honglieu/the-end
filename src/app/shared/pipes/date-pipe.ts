import {
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
  Pipe,
  PipeTransform
} from '@angular/core';
import dayjs from 'dayjs';
import { Observable, combineLatest, map } from 'rxjs';
import { convertUTCToLocalDateTime } from '@core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
/**
 * @usage
 * ```
 * <span>{{ value | dateCase | async }} </span>
 * ```
 */
const timeFormats = {
  minute: { singular: 'minute ago', plural: 'minutes ago', short: 'm ago' },
  hour: { singular: 'hour ago', plural: 'hours ago', short: 'h ago' },
  day: { singular: 'day ago', plural: 'days ago', short: 'd ago' },
  month: { singular: 'month ago', plural: 'months ago', short: 'mo ago' },
  year: { singular: 'year', plural: 'years', short: 'y' }
};

const formatTime = (unit: string, value: number, onlyAgo: boolean = false) => {
  const format = timeFormats[unit];
  if (onlyAgo) {
    return `${value} ${value === 1 ? format.singular : format.plural}`;
  } else {
    return value === 1
      ? `${value} ${format.singular}`
      : `${value}${format.short}`;
  }
};

@Pipe({ name: 'dateCase', pure: false })
export class DateCasePipe implements PipeTransform, OnDestroy {
  private date: any;
  private currDate: any;
  private timer: number;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  public transform(
    str: string,
    onlyAgo: boolean = false,
    displayDayWithinAMonth: boolean = true,
    isRealtime: boolean = false
  ): Observable<string> {
    if (isRealtime) {
      this.handleRerenderRealtime(str);
    }

    return combineLatest([
      this.agencyDateFormatService.dateFormatDayJS$,
      this.agencyDateFormatService.timezone$
    ]).pipe(
      map(([dateFormat, timezoneObj]) => {
        if (str != null && str !== '') {
          const date = new Date(str);
          this.date = date.getTime();
          const givenDate = dayjs(
            convertUTCToLocalDateTime(date, timezoneObj.value)
          );
          const currDate = new Date();
          const currentDate = dayjs(
            convertUTCToLocalDateTime(currDate, timezoneObj.value)
          );
          const yesterday = currentDate.clone().subtract(1, 'day');

          const isToday = givenDate.isSame(currentDate, 'day');
          const isYesterday = givenDate.isSame(yesterday, 'day');

          this.currDate = currDate.getTime();

          const SECOND_MILLIS = 1000;
          const MINUTE_MILLIS = 60 * SECOND_MILLIS;
          const HOUR_MILLIS = 60 * MINUTE_MILLIS;
          const DAY_MILLIS = 24 * HOUR_MILLIS;
          const WEEK_MILLIS = 7 * DAY_MILLIS;
          const MONTH_MILLIS = 30 * DAY_MILLIS;
          const YEAR_MILLIS = 365 * DAY_MILLIS;

          const diff = this.currDate - this.date;

          if (diff < MINUTE_MILLIS) {
            return 'now';
          }

          if (isToday && diff <= DAY_MILLIS) {
            if (diff <= HOUR_MILLIS) {
              return formatTime(
                'minute',
                Math.floor(diff / MINUTE_MILLIS),
                onlyAgo
              );
            } else {
              return formatTime(
                'hour',
                Math.floor(diff / HOUR_MILLIS),
                onlyAgo
              );
            }
          }

          if (isYesterday) {
            return formatTime('day', 1, onlyAgo);
          }

          if (diff > DAY_MILLIS && diff <= WEEK_MILLIS) {
            return formatTime('day', Math.floor(diff / DAY_MILLIS), onlyAgo);
          }

          if (diff > WEEK_MILLIS && !onlyAgo) {
            return givenDate.format(dateFormat);
          } else if (diff > WEEK_MILLIS && !displayDayWithinAMonth) {
            return givenDate.format(dateFormat);
          }

          if (
            diff > WEEK_MILLIS &&
            diff <= MONTH_MILLIS &&
            displayDayWithinAMonth
          ) {
            return formatTime('day', Math.floor(diff / DAY_MILLIS), onlyAgo);
          }

          if (diff > MONTH_MILLIS && diff <= YEAR_MILLIS) {
            return formatTime(
              'month',
              Math.floor(diff / MONTH_MILLIS),
              onlyAgo
            );
          }

          if (diff > YEAR_MILLIS) {
            return formatTime('year', Math.floor(diff / YEAR_MILLIS), onlyAgo);
          }

          return '';
        }
        return '';
      })
    );
  }

  handleRerenderRealtime(str: string) {
    this.removeTimer();
    let d = new Date(str);
    let now = new Date();
    let seconds = Math.round(Math.abs((now.getTime() - d.getTime()) / 1000));
    let timeToUpdate = Number.isNaN(seconds)
      ? 1000
      : this.getSecondsUntilUpdate(seconds) * 1000;
    if (timeToUpdate < 300000) {
      this.timer = this.ngZone.runOutsideAngular(() => {
        if (typeof window !== 'undefined') {
          return window.setTimeout(() => {
            this.ngZone.run(() => this.changeDetectorRef.markForCheck());
          }, timeToUpdate);
        }
        return null;
      });
    }
  }

  ngOnDestroy(): void {
    this.removeTimer();
  }

  private removeTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private getSecondsUntilUpdate(seconds: number) {
    let min = 60;
    let hr = min * 60;
    let day = hr * 24;
    if (seconds < min) {
      return 2;
    } else if (seconds < hr) {
      return 30;
    } else if (seconds < day) {
      return 300;
    } else {
      return 3600;
    }
  }
}
