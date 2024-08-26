import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trunCateUrl'
})
export class TrunCateUrlPipe implements PipeTransform {
  transform(value: string, limit: number = 30): string {
    return value?.length > limit ? value.slice(0, limit) + '...' : value;
  }
}
