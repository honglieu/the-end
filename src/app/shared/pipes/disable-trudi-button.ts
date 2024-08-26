import { Pipe, PipeTransform } from '@angular/core';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Pipe({ name: 'disableTrudiButton' })
export class DisableTrudiButtonPipe implements PipeTransform {
  transform(status?: TrudiButtonEnumStatus): boolean {
    return (
      status === TrudiButtonEnumStatus.COMPLETED ||
      status === TrudiButtonEnumStatus.SCHEDULED
    );
  }
}
