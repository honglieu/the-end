import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'map'
})
export class MapPipe implements PipeTransform {
  transform(items: any[], callback: (item: any) => boolean): any[] {
    if (!items || !callback) {
      return items;
    }
    return items.map(callback);
  }
}
