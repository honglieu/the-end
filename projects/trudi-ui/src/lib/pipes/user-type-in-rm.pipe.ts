import { Pipe, PipeTransform } from '@angular/core';

 enum EUserPropertyType {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  AGENT = 'AGENT',
  SUPPLIER = 'SUPPLIER',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PROPERTY_MANAGER = 'PROPERTY MANAGER',
  UNIDENTIFIED = 'UNIDENTIFIED',
  OTHER = 'OTHER',
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  EXTERNAL = 'EXTERNAL',
  USER = 'USER',
  OWNER = 'OWNER',
  TENANT_UNIT = 'TENANT_UNIT',
  TENANT_PROPERTY = 'TENANT_PROPERTY',
  TENANT_PROSPECT = 'TENANT_PROSPECT',
  OWNER_PROSPECT = 'OWNER_PROSPECT',
  LANDLORD_PROSPECT = 'LANDLORD_PROSPECT',
  TENANT_RM = 'TENANT_RM',
  TENANCY = 'TENANCY',
  OWNERSHIP = 'OWNERSHIP',
  MAILBOX = 'MAILBOX',
  CALENDAR_EVENT_BULK_CREATE_TASKS = 'CALENDAR_EVENT_BULK_CREATE_TASKS',
  UNRECOGNIZED = 'UNRECOGNIZED',
  BELONGS_TO_OTHER_PROPERTIES = 'BELONGS_TO_OTHER_PROPERTIES'
}

const USER_TYPE_IN_RM = {
  TENANT_PROPERTY: 'Tenant (property)',
  TENANT_UNIT: 'Tenant (unit)',
  TENANT_PROSPECT: 'Tenant prospect',
  LANDLORD_PROSPECT: 'Owner prospect',
  LANDLORD: 'Owner'
};

@Pipe({
  standalone: true,
  name: 'userTypeInRm'
})
export class TrudiUserTypeInRmPipe implements PipeTransform {
  transform(value: string, type: string, isRmEnvironment: boolean): string {
    if (!isRmEnvironment) return value;
    const upperValue = value?.toUpperCase();
    switch (type) {
      case userType.TYPE:
        if (
          [
            EUserPropertyType.TENANT_UNIT,
            EUserPropertyType.TENANT_PROPERTY
          ].includes(value as EUserPropertyType)
        ) {
          return USER_TYPE_IN_RM[upperValue]?.replace('Tenant ', '');
        }
        return '';
      case userType.NO_BRACKET:
        return USER_TYPE_IN_RM[upperValue]?.replace(/\(|\)/g, '') ?? value;
      case userType.DEFAULT:
        return USER_TYPE_IN_RM[upperValue] ?? value;
      default:
        return '';
    }
  }
}

export enum userType {
  TYPE = 'TYPE',
  NO_BRACKET = 'NO_BRACKET',
  DEFAULT = 'DEFAULT'
}
