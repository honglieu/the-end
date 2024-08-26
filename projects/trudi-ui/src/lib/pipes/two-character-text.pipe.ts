import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'twoCharacter'
})
export class TwoCharacterTextPipe implements PipeTransform {
  transform(value: string): string {
    const chars = value?.split(' ');
    if (!chars?.length || chars.length < 1) return '';
    if (chars?.length === 1) {
      return chars[0].substring(0, 2).toUpperCase();
    }
    return (chars[0].charAt(0) + chars[1].charAt(0)).toUpperCase();
  }
}
