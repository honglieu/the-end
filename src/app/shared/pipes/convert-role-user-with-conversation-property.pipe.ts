import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';
export interface IValueRoleUserProperty {
  userPropertyType: EUserPropertyType | string;
  isMachingPropertyWithConversation: boolean;
  isNoPropertyConversation: boolean;
  isPrimary: boolean;
  userType: EUserPropertyType;
  isTemporary: boolean;
}
@Pipe({
  name: 'convertRoleUserWithConversationProperty'
})
export class ConvertRoleUserWithConversationPropertyPipe
  implements PipeTransform
{
  private propertyTypeMap = {
    [EUserPropertyType.LANDLORD]: 'Owner',
    [EUserPropertyType.TENANT]: 'Tenant',
    [EUserPropertyType.AGENT]: 'Agent',
    [EUserPropertyType.SUPPLIER]: 'Supplier',
    [EUserPropertyType.PROPERTY_MANAGER]: 'Property manager',
    [EUserPropertyType.UNIDENTIFIED]: 'Unidentified',
    [EUserPropertyType.OTHER]: 'Other contacts',
    [EUserPropertyType.ADMIN]: 'Administrator',
    [EUserPropertyType.LEAD]: 'Lead',
    [EUserPropertyType.EXTERNAL]: 'External',
    [EUserPropertyType.USER]: 'User',
    [EUserPropertyType.OWNER]: 'Owner',
    [EUserPropertyType.TENANT_UNIT]: 'Tenant unit',
    [EUserPropertyType.TENANT_PROPERTY]: 'Tenant property',
    [EUserPropertyType.TENANT_PROSPECT]: 'Tenant prospect',
    [EUserPropertyType.OWNER_PROSPECT]: 'Owner prospect',
    [EUserPropertyType.LANDLORD_PROSPECT]: 'Owner prospect',
    [EUserPropertyType.TENANT_RM]: 'Tenant rm',
    [EUserPropertyType.TENANCY]: 'Tenancy',
    [EUserPropertyType.OWNERSHIP]: 'Ownership'
  };

  transform(value: IValueRoleUserProperty) {
    const {
      userPropertyType,
      isMachingPropertyWithConversation,
      isNoPropertyConversation,
      isPrimary,
      userType,
      isTemporary
    } = value;
    let propertyLabel = this.propertyTypeMap[userPropertyType] || '';
    if (
      [EUserPropertyType.SUPPLIER, EUserPropertyType.OTHER].includes(userType)
    )
      propertyLabel = this.propertyTypeMap[userType];

    if (isTemporary && userType !== EUserPropertyType.MAILBOX)
      return '(Unrecognized)';

    if (
      (isNoPropertyConversation &&
        ![EUserPropertyType.SUPPLIER, EUserPropertyType.OTHER].includes(
          userType
        )) ||
      userType === EUserPropertyType.MAILBOX
    ) {
      return '';
    }

    if (
      (isMachingPropertyWithConversation ||
        (!isNoPropertyConversation &&
          [EUserPropertyType.SUPPLIER, EUserPropertyType.OTHER].includes(
            userType
          ))) &&
      isPrimary &&
      (userPropertyType === EUserPropertyType.LANDLORD ||
        userPropertyType === EUserPropertyType.TENANT ||
        userPropertyType === EUserPropertyType.TENANT_UNIT ||
        userPropertyType === EUserPropertyType.TENANT_PROPERTY)
    ) {
      propertyLabel = 'Primary ' + propertyLabel.toLowerCase();
      return `(${propertyLabel})`;
    }

    if (
      !isMachingPropertyWithConversation &&
      !isNoPropertyConversation &&
      userPropertyType
    ) {
      return '(Belongs to other properties)';
    }

    return propertyLabel ? `(${propertyLabel})` : '';
  }
}
