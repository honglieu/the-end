import { InjectionToken } from '@angular/core';

import { DateLocale, TrudiI18nInterface } from './trudi-i18n.interface';

export const TRUDI_I18N = new InjectionToken<TrudiI18nInterface>('trudi-i18n');

export const TRUDI_DATE_LOCALE = new InjectionToken<DateLocale>(
  'trudi-date-locale'
);
