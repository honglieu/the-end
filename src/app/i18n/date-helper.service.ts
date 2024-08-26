import { formatDate } from '@angular/common';
import { Inject, Injectable, Injector, Optional } from '@angular/core';

import {
  format as fnsFormat,
  getISOWeek as fnsGetISOWeek,
  parse as fnsParse
} from 'date-fns';
import { enGB } from 'date-fns/locale';

import { NgTimeParser } from '@core/time';
import { WeekDayIndex } from '@trudi-ui';

import {
  mergeDateConfig,
  TrudiDateConfig,
  TRUDI_DATE_CONFIG
} from './date-config';
import { TrudiI18nService } from './trudi-i18n.service';

export function DATE_HELPER_SERVICE_FACTORY(
  injector: Injector,
  config: TrudiDateConfig
): DateHelperService {
  const i18n = injector.get(TrudiI18nService);
  return i18n.getDateLocale()
    ? new DateHelperByDateFns(i18n, config)
    : new DateHelperByDatePipe(i18n, config);
}

@Injectable({
  providedIn: 'root',
  useFactory: DATE_HELPER_SERVICE_FACTORY,
  deps: [Injector, [new Optional(), TRUDI_DATE_CONFIG]]
})
export abstract class DateHelperService {
  constructor(
    protected i18n: TrudiI18nService,
    @Optional() @Inject(TRUDI_DATE_CONFIG) protected config: TrudiDateConfig
  ) {
    this.config = mergeDateConfig(this.config);
  }

  abstract getISOWeek(date: Date): number;
  abstract getFirstDayOfWeek(): WeekDayIndex;
  abstract format(date: Date | null, formatStr: string): string;
  abstract parseDate(text: string, formatStr?: string): Date;
  abstract parseTime(text: string, formatStr?: string): Date | undefined;
}

export class DateHelperByDateFns extends DateHelperService {
  getISOWeek(date: Date): number {
    return fnsGetISOWeek(date);
  }

  getFirstDayOfWeek(): WeekDayIndex {
    let defaultWeekStartsOn: WeekDayIndex;
    try {
      defaultWeekStartsOn = this.i18n.getDateLocale().options!.weekStartsOn!;
    } catch (e) {
      defaultWeekStartsOn = 1;
    }
    return this.config.firstDayOfWeek == null
      ? defaultWeekStartsOn
      : this.config.firstDayOfWeek;
  }

  format(date: Date, formatStr: string): string {
    return date
      ? fnsFormat(date, formatStr, { locale: this.i18n.getDateLocale() })
      : '';
  }

  parseDate(text: string, formatStr: string): Date {
    return fnsParse(text, formatStr, new Date(), {
      locale: enGB,
      weekStartsOn: 1
    });
  }

  parseTime(text: string, formatStr: string): Date | undefined {
    return this.parseDate(text, formatStr);
  }
}

export class DateHelperByDatePipe extends DateHelperService {
  getISOWeek(date: Date): number {
    return +this.format(date, 'w');
  }

  getFirstDayOfWeek(): WeekDayIndex {
    if (this.config.firstDayOfWeek === undefined) {
      const locale = this.i18n.getLocaleId();
      return locale && ['zh-cn', 'zh-tw'].indexOf(locale.toLowerCase()) > -1
        ? 1
        : 0;
    }
    return this.config.firstDayOfWeek;
  }

  format(date: Date | null, formatStr: string): string {
    const checkDate = new Date(date).getTime();
    return date && !isNaN(checkDate)
      ? formatDate(date, formatStr, this.i18n.getLocaleId())!
      : '';
  }

  parseDate(text: string, formatStr: string = null): Date {
    if (!formatStr) {
      return new Date(text);
    }
    return fnsParse(text, formatStr, new Date(), {
      locale: enGB,
      weekStartsOn: 1
    });
  }

  parseTime(text: string, formatStr: string): Date {
    const parser = new NgTimeParser(formatStr, this.i18n.getLocaleId());
    return parser.toDate(text);
  }
}
