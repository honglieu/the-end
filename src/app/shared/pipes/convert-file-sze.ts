import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertFileSize'
})
export class ConvertFileSizePipe implements PipeTransform {
  private units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  transform(value: string) {
    if (!value) {
      return '';
    }

    let l = 0,
      n = parseInt(value, 10) || 0;
    while (n >= 1024 && ++l) {
      n = n / 1024;
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + this.units[l];
  }
}
