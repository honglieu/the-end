import { Pipe, PipeTransform } from '@angular/core';

import { timeUnits } from '@core';
import { padStart } from '@core';

@Pipe({
  name: 'trudiTimeRange',
  pure: true
})
export class TrudiTimeRangePipe implements PipeTransform {
  transform(value: string | number, format: string = 'HH:mm:ss'): string {
    let duration = Number(value || 0);

    return timeUnits.reduce((current, [name, unit]) => {
      if (current.indexOf(name) !== -1) {
        const v = Math.floor(duration / unit);
        duration -= v * unit;
        return current.replace(new RegExp(`${name}+`, 'g'), (match: string) =>
          padStart(v.toString(), match.length, '0')
        );
      }
      return current;
    }, format);
  }
}
