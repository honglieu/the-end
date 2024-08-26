import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFullname'
})
export class TrudiFormatFullnamePipe implements PipeTransform {
  transform(
    value: { firstName: string; lastName: string },
    preventSplit: boolean = false
  ): string {
    const { firstName, lastName } = value;
    if (preventSplit) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
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
