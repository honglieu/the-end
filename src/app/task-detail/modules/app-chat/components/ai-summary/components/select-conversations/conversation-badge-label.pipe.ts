import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TrudiUserTypeInRmPipe, userType } from '@trudi-ui';

@Pipe({
  name: 'conversationBadgeLabel'
})
export class ConversationBadgeLabel implements PipeTransform {
  constructor(
    private titleCase: TitleCasePipe,
    private userTypeRM: TrudiUserTypeInRmPipe
  ) {}

  transform(conversation): string {
    let label = '';
    switch (conversation?.startMessageBy) {
      case EUserPropertyType.OTHER:
        label = conversation.contactType;
        break;
      case EUserPropertyType.USER:
        label =
          conversation.propertyType === EUserPropertyType.LANDLORD
            ? EUserPropertyType.OWNER
            : conversation.propertyType;
        break;
      default:
        label = this._getUserTypeInRM(
          conversation.startMessageBy,
          userType.DEFAULT,
          true
        );
        break;
    }
    label = label.replace('_', ' ');
    if (conversation.isPrimary) {
      return `Primary ${label.toLowerCase()}`;
    }
    return `${label.charAt(0).toUpperCase()}${label.slice(1).toLowerCase()}`;
  }

  private _getUserTypeInRM(userType: string, type: string, isRM: boolean) {
    return this.userTypeRM.transform(userType, type, isRM);
  }
}
