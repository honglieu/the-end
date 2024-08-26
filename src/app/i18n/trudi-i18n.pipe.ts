import { Pipe, PipeTransform } from '@angular/core';

import { TrudiI18nService } from './trudi-i18n.service';

@Pipe({
  name: 'trudiI18n'
})
export class TrudiI18nPipe implements PipeTransform {
  constructor(private _locale: TrudiI18nService) {}

  transform(path: string, keyValue?: object): string {
    return this._locale.translate(path, keyValue);
  }
}
