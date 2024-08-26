import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'totalCountPipe'
})
export class TrudiTotalCountPipe implements PipeTransform {
  transform(
    value: number,
    limit: number = 999,
    allowZero: boolean = false,
    prefix: string = ''
  ): string {
    value = Number(value);
    if (isNaN(value) || (!allowZero && value <= 0)) return '';
    return value > limit ? `${limit}+` : prefix + (value?.toString() || '0');
  }
}
