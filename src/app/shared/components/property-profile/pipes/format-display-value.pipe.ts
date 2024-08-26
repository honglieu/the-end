import { Pipe, PipeTransform } from '@angular/core';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

dayjs.extend(relativeTime);

@Pipe({
  name: 'formatDisplayValue'
})
export class FormatDisplayValuePipe implements PipeTransform {
  transform(value?: string, type?: 'date' | 'string' | 'currency'): string {
    if (!value || value.trim() === '') {
      return type === 'date' ? '--/--/--' : '_';
    }

    if (type === 'currency' && value.trim() !== '_' && value.trim() !== '-')
      return '$' + value;
    return value;
  }
}
