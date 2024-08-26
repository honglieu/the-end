import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { warn } from '@core';
import { IndexableObject, TrudiSafeAny } from '@core';

import en_US from './languages/en_US';
import { en_GB } from './public-api';
import { DateLocale, TrudiI18nInterface } from './trudi-i18n.interface';
import { TRUDI_DATE_LOCALE, TRUDI_I18N } from './trudi-i18n.token';

@Injectable({
  providedIn: 'root'
})
export class TrudiI18nService {
  private _locale!: TrudiI18nInterface;
  private _change = new BehaviorSubject<TrudiI18nInterface>(this._locale);
  private dateLocale!: DateLocale;

  get localeChange(): Observable<TrudiI18nInterface> {
    return this._change.asObservable();
  }

  constructor(
    @Optional() @Inject(TRUDI_I18N) locale: TrudiI18nInterface,
    @Optional() @Inject(TRUDI_DATE_LOCALE) dateLocale: DateLocale
  ) {
    this.setLocale(en_GB);
    this.setDateLocale(dateLocale || null);
  }

  // [NOTE] Performance issue: this method may called by every change detections
  // TODO: cache more deeply paths for performance
  translate(path: string, data?: TrudiSafeAny): string {
    // this._logger.debug(`[TrudiI18nService] Translating(${this._locale.locale}): ${path}`);
    let content = this._getObjectPath(this._locale, path) as string;
    if (typeof content === 'string') {
      if (data) {
        Object.keys(data).forEach(
          (key) =>
            (content = content.replace(new RegExp(`%${key}%`, 'g'), data[key]))
        );
      }
      return content;
    }
    return path;
  }

  /**
   * Set/Change current locale globally throughout the WHOLE application
   * NOTE: If called at runtime, rendered interface may not change along with the locale change,
   * because this do not trigger another render schedule.
   *
   * @param locale The translating letters
   */
  setLocale(locale: TrudiI18nInterface): void {
    if (this._locale && this._locale.locale === locale.locale) {
      return;
    }
    this._locale = locale;
    this._change.next(locale);
  }

  getLocale(): TrudiI18nInterface {
    return this._locale;
  }

  getLocaleId(): string {
    return 'en';
  }

  setDateLocale(dateLocale: DateLocale): void {
    this.dateLocale = dateLocale;
  }

  getDateLocale(): DateLocale {
    return this.dateLocale;
  }

  /**
   * Get locale data
   *
   * @param path dot paths for finding exist value from locale data, eg. "a.b.c"
   * @param defaultValue default value if the result is not "truthy"
   */
  getLocaleData(path: string, defaultValue?: TrudiSafeAny): TrudiSafeAny {
    const result = path
      ? this._getObjectPath(this._locale, path)
      : this._locale;

    if (!result && !defaultValue) {
      warn(`Missing translations for "${path}" in language "${this._locale.locale}".
You can use "TrudiI18nService.setLocale"`);
    }

    return result || defaultValue || this._getObjectPath(en_US, path) || {};
  }

  private _getObjectPath(
    obj: IndexableObject,
    path: string
  ): string | object | TrudiSafeAny {
    let res = obj;
    const paths = path.split('.');
    const depth = paths.length;
    let index = 0;
    while (res && index < depth) {
      res = res[paths[index++]];
    }
    return index === depth ? res : null;
  }
}
