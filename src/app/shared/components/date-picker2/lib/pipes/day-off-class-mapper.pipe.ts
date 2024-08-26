import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dayOffClassMapper'
})
export class DayOffClassMapperPipe implements PipeTransform {
  transform(value: object = {}, distinct: boolean = true) {
    return {
      ...value,
      'trudi-picker-cell-off': distinct
        ? value['trudi-picker-cell-off']
        : undefined
    };
  }
}
