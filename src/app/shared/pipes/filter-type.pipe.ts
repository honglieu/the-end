import { PipeTransform, Pipe } from '@angular/core';
@Pipe({
  name: 'filterByType'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], type: string): any[] {
    if (!items) return [];
    if (!type) return items;

    return items.filter((it) => {
      if (typeof it[type] === 'boolean') return !it[type];
      // handle for anymore case;
      return it;
    });
  }
}
