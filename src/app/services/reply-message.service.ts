import { EConversationType, IMessage } from '@shared';
import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SharedService } from '@/app/services/shared.service';
import { UserService } from '@/app/services/user.service';
import {
  ICreator,
  IFacebookMessage
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { trudiUserId, UserType } from './constants';

@Injectable({
  providedIn: 'root'
})
export class ReplyMessageService {
  public triggerReply: Subject<IMessage> = new Subject();
  public triggerScrollToElement: Subject<string> = new Subject();
  private sharedService = inject(SharedService);
  private userService = inject(UserService);

  getReplyTitle(
    message: IMessage | IFacebookMessage,
    fromCompose: boolean = false
  ) {
    if (!message) return null;
    const { USER, PAGE, LEAD } = UserType;
    const userId = this.userService.userInfo$?.value?.id;
    const getName = (creator: ICreator) => {
      if (!creator) {
        return '';
      }
      return creator?.isTemporary && creator?.externalId
        ? creator?.externalId ?? creator.phoneNumber
        : creator?.facebookName ??
            this.sharedService.displayName(creator.firstName, creator.lastName);
    };
    const creator = message.creator;
    const creatorSendType = message.userSendType;
    const replyCreator = message.messageReply?.creator;
    const isCreator = creator?.id === userId;
    if (fromCompose) {
      return isCreator
        ? 'You are replying to yourself'
        : `You are replying to ${getName(message.creator)}`;
    }

    if (!message.messageReply) return null;

    let creatorName = getName(creator);
    let repliedCreatorName = getName(replyCreator);
    if (isCreator || message.type === PAGE) {
      creatorName = 'You';
    }

    if (creatorSendType === USER) {
      if (replyCreator.id === userId || message.messageReply?.type === PAGE) {
        repliedCreatorName = 'you';
      } else if (replyCreator.id == creator.id) {
        repliedCreatorName = 'themself';
      }
    } else {
      if (replyCreator.id === trudiUserId && !message.messageReply.type) {
        repliedCreatorName = 'Trudi';
      } else if (
        (creator.type === LEAD || message?.type === PAGE) &&
        (replyCreator.id === userId || message?.messageReply?.type === PAGE)
      ) {
        repliedCreatorName = creatorName === 'You' ? 'yourself' : 'you';
      } else if (
        creator.type === LEAD &&
        replyCreator.id === creator.id &&
        creator.id !== userId
      ) {
        repliedCreatorName = 'themself';
      }
    }

    return `${creatorName} replied to ${repliedCreatorName}`;
  }
}
