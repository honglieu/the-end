import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform(
    value: unknown[],
    sortArg?: string | ((a: unknown, b: unknown) => number)
  ) {
    if (typeof sortArg === 'string')
      return value?.sort((a, b) => (a[sortArg] - b[sortArg] > 0 ? 1 : -1));
    return value?.sort(sortArg);
  }
}
