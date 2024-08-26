import { Pipe, PipeTransform } from '@angular/core';
import { USER_TYPE, USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { formatTitle } from '@shared/feature/function.feature';
import { TaskItem } from '@shared/types/task.interface';

@Pipe({
  name: 'messageDetail'
})
export class MessageDetailPipe implements PipeTransform {
  transform(
    message?: TaskItem,
    property?: EMessageDetailProperty,
    isRmEnvironment?: boolean
  ): string {
    if (!message) return '';
    const conversation = message.conversations[0];
    switch (property) {
      case EMessageDetailProperty.USERNAME:
        return conversation?.type === EUserPropertyType.EXTERNAL
          ? conversation?.email || ' '
          : (conversation?.firstName || ' ') +
              ' ' +
              (conversation?.lastName || ' ');
      case EMessageDetailProperty.ROLE:
        const propertyType = conversation?.propertyType;
        if (conversation?.type === EUserPropertyType.EXTERNAL)
          return 'External Email';
        switch (propertyType) {
          case EConfirmContactType.OTHER:
            return conversation?.contactType?.replace('_', ' ');
          case EConfirmContactType.EXTERNAL:
            return USER_TYPE[EConfirmContactType.EXTERNAL];
          case EConfirmContactType.AGENT:
            return 'Property Manager';
          case EUserPropertyType.LANDLORD:
            return 'Owner';
          case EUserPropertyType.LANDLORD_PROSPECT:
            return 'Owner prospect';
          case EConfirmContactType.TENANT_UNIT:
            return isRmEnvironment ? USER_TYPE_IN_RM.TENANT_UNIT : propertyType;
          case EConfirmContactType.TENANT_PROPERTY:
            return isRmEnvironment
              ? USER_TYPE_IN_RM.TENANT_PROPERTY
              : propertyType;
          default:
            return propertyType;
        }
      case EMessageDetailProperty.TITLE:
        if (!conversation) return message.title;
        const title =
          conversation?.firstName || conversation?.lastName || 'Unknown';
        return formatTitle(title);
      default:
        return '';
    }
  }
}
//Which result you want to get from pipe
export enum EMessageDetailProperty {
  USERNAME = 'USERNAME',
  ROLE = 'ROLE',
  TITLE = 'TITLE'
}
