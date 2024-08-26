import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatShortName'
})
export class FormatShortName implements PipeTransform {
  transform(value: { firstName: string; lastName: string }) {
    const { firstName, lastName } = value;
    const arrName = `${firstName || ''} ${lastName || ''}`.trim().split(' ');
    if (arrName.length >= 2) {
      return arrName[0].charAt(0) + arrName[1].charAt(0);
    } else if (arrName.length === 1) {
      return arrName[0].charAt(0) + (arrName[0]?.charAt(1) || '');
    } else {
      return '';
    }
  }
}
