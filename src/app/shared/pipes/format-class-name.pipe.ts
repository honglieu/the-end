import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'formatClassName' })
export class FormatClassNamePipe implements PipeTransform {
  transform(data: string, prefix: string = '', suffix: string = '') {
    const className = (
      data.toLowerCase().split(' ').join('-') as any
    )?.replaceAll('.', '');
    if (prefix || suffix) {
      return `${prefix}${className}${suffix}`;
    }
    return className;
  }
}
