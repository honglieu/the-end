import { Pipe, PipeTransform } from '@angular/core';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Pipe({ name: 'trudiButtonClass' })
export class TrudiButtonClassPipe implements PipeTransform {
  transform(status?: TrudiButtonEnumStatus): string {
    switch (status) {
      case TrudiButtonEnumStatus.SKIP:
        return 'is-skip';
      case TrudiButtonEnumStatus.SCHEDULED:
        return 'scheduled-text-color';
      case TrudiButtonEnumStatus.COMPLETED:
        return 'un-highlight';
      case TrudiButtonEnumStatus.PENDING:
      default:
        return '';
    }
  }
}
