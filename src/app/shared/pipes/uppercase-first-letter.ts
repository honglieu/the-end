import { Pipe, PipeTransform } from '@angular/core';
import { isEmail } from '@shared/feature/function.feature';

@Pipe({ name: 'uppercaseFirstLetter' })
export class UppercaseFirstLetterPipe implements PipeTransform {
  transform(value: string, isCustom: boolean = false): string {
    if (!value) return '';

    if (isCustom) {
      if (/^[a-z]/.test(value) && !isEmail(value)) {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    }
    return value
      .split(' - ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' - ')
      .split(': ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(': ')
      .split('. ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('. ');
  }
}
