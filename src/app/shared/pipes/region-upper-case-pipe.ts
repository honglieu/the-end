import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'regionUpperCase'
})
export class RegionUpperCasePipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\[[^\[|\]]+\]/g, (letter) => letter.toUpperCase());
  }
}
