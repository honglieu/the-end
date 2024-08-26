import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  constructor() {}

  transform(value: string, addAgo?: boolean) {
    return dayjs(value).fromNow();
  }
}
