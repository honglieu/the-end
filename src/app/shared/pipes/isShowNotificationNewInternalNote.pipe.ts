import { Pipe, PipeTransform } from '@angular/core';
import { NotificationTypeEnum } from '../enum';

@Pipe({
  name: 'isShowNotificationNewInternalNote'
})
export class IsShowNotificationNewInternalNotePipe implements PipeTransform {
  transform(notiType: NotificationTypeEnum): boolean {
    const validNotiTypes = [
      NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED,
      NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED
    ];
    return validNotiTypes.includes(notiType);
  }
}
