import { Pipe, PipeTransform } from '@angular/core';
import {
  convertTime12to24,
  convertTime24to12
} from '@/app/trudi-send-msg/utils/helper-functions';
/**
 * @usage
 * ```
 * <span> {{ value | formatTimeString }}
 * ```
 */

@Pipe({ name: 'formatTimeString' })
export class FormatTimeStringPipe implements PipeTransform {
  constructor() {}
  transform(value: string, isCustom?: false): string {
    if (isCustom) return convertTime12to24(value as string);
    return convertTime24to12(value as string);
  }
}
