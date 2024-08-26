import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Pipe({
  name: 'convertRoleUserProperty'
})
export class ConvertRoleUserPropertyPipe implements PipeTransform {
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

  transform(value: string, isPrimary?: boolean, isConfirmProperties?: boolean) {
    let propertyLabel = this.propertyTypeMap[value] || '';

    if (
      isPrimary &&
      (value === EUserPropertyType.LANDLORD ||
        value === EUserPropertyType.TENANT ||
        value === EUserPropertyType.TENANT_UNIT ||
        value === EUserPropertyType.TENANT_PROPERTY)
    ) {
      propertyLabel = 'Primary ' + propertyLabel.toLowerCase();
      return propertyLabel;
    }
    if (isConfirmProperties && value === EUserPropertyType.EXTERNAL) {
      propertyLabel = 'External email';
    }
    return propertyLabel;
  }
}
