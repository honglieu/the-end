import { isEqual } from 'lodash-es';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'contactIndex' })
export class ContactIndexPipe implements PipeTransform {
  transform(
    receiver: ISelectedReceivers,
    selectedReceivers: ISelectedReceivers[]
  ) {
    return selectedReceivers.findIndex((item) => isEqual(item, receiver)) + 1;
  }
}
