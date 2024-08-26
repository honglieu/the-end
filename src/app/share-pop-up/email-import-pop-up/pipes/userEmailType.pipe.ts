import { PipeTransform, Pipe } from '@angular/core';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';

const USER_TYPE = {
  TENANT: 'tenant',
  TENANT_PROPERTY: 'tenant property',
  TENANT_UNIT: 'tenant unit',
  TENANT_PROSPECT: 'tenant',
  LANDLORD_PROSPECT: 'owner',
  LANDLORD: 'owner',
  SUPPLIER: 'supplier',
  OWNER: 'owner',
  OWNER_PROSPECT: 'owner',
  OTHER: 'other'
};

@Pipe({
  name: 'userEmailType'
})
export class UserEmailTypePipe implements PipeTransform {
  transform(value: EUserPropertyType, isPrimary = false, crm: ECRMSystem) {
    let textValue = '';
    switch (crm) {
      case ECRMSystem.RENT_MANAGER:
        textValue = `Primary ${USER_TYPE[value]}`;
        break;
      case ECRMSystem.PROPERTY_TREE:
        textValue = `Primary ${USER_TYPE[value].replace(
          / Property| Unit/gi,
          ''
        )}`;
        break;
    }
    if (!isPrimary) {
      textValue = textValue.replace('Primary ', '');
    }
    textValue = textValue.charAt(0).toUpperCase() + textValue.slice(1);
    return textValue;
  }
}
