import { pluralize } from '@core';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pluralize' })
export class PluralizePipe implements PipeTransform {
  transform(
    value: number,
    noun: string,
    excludeValue: boolean = false
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (!noun) {
      return value.toString();
    }

    if (excludeValue) {
      return `${pluralize(noun, Number(value))}`;
    }

    return `${value} ${pluralize(noun, Number(value))}`;
  }
}
