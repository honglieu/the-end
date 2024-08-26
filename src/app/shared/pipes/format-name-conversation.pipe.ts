import { Pipe, PipeTransform } from '@angular/core';
import { IListConversationConfirmProperties } from '@shared/types/conversation.interface';
import { displayName, isEmail } from '@shared/feature/function.feature';
import { EUserPropertyType } from '@shared/enum/user.enum';
@Pipe({
  name: 'formatNameConversation'
})
export class FormatNameConversationPipe implements PipeTransform {
  transform(conversation: IListConversationConfirmProperties): string {
    if (!conversation) {
      return '';
    }

    if (conversation.propertyType === EUserPropertyType.EXTERNAL) {
      if (isEmail(conversation.email)) {
        return conversation.email || ' ';
      } else {
        return displayName(conversation.email, '')?.trim();
      }
    } else {
      if (isEmail(conversation.firstName)) {
        return displayName(conversation.firstName, conversation.lastName);
      } else {
        return displayName(
          conversation.firstName,
          conversation.lastName
        )?.trim();
      }
    }
  }
}
