import { Pipe, PipeTransform } from '@angular/core';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { CallTypeEnum } from '@shared/enum/share.enum';

@Pipe({
  name: 'inboxIcon'
})
export class InboxIconPipe implements PipeTransform {
  transform(message: string, callType?: CallTypeEnum): string {
    switch (callType) {
      case CallTypeEnum.videoCall:
        return 'videoCallOutline';
      case CallTypeEnum.voiceCall:
        return 'phoneCall';
      default:
        break;
    }
    switch (message) {
      case EMessageComeFromType.EMAIL:
        return 'mailThin';
      case EMessageComeFromType.APP:
        if (callType === CallTypeEnum.videoCall) return 'videoCallOutline';
        if (callType === CallTypeEnum.voiceCall) return 'phoneCall';
        return 'messageTrudiApp';
      case EMessageComeFromType.VIDEO_CALL:
        return 'videoCallOutline';
      case EMessageComeFromType.VOICE_CALL:
        return 'phoneCall';
      case EMessageComeFromType.VOICE_MAIL:
        return 'voiceMail';
      default:
        return '';
    }
  }
}
