import { EUserPropertyType } from '@shared/enum';
import { UppercaseFirstLetterPipe } from '@shared/pipes/uppercase-first-letter';
import { Pipe, PipeTransform } from '@angular/core';

const OWNER_PROSPECT = 'OWNER PROSPECT';
@Pipe({
  name: 'pmRole'
})
export class PmRolePipe implements PipeTransform {
  constructor(private uppercaseFirstLetterPipe: UppercaseFirstLetterPipe) {}
  transform(
    value: EUserPropertyType,
    isPrimary: boolean,
    userType: EUserPropertyType
  ): string {
    if (!value && !userType) return '';

    let target = value || userType;

    if (target === EUserPropertyType.LEAD) {
      return '';
    }

    return isPrimary
      ? `• Primary ${getRole(target)?.replace('_', ' ')?.toLowerCase()}`
      : `• ${this.uppercaseFirstLetterPipe.transform(
          getRole(target)?.replace('_', ' ')
        )}`;
  }
}

const getRole = (role: EUserPropertyType) => {
  switch (role) {
    case EUserPropertyType.LANDLORD:
    case EUserPropertyType.LANDLORD_PROSPECT:
      return EUserPropertyType.OWNER;
    case EUserPropertyType.LANDLORD_PROSPECT:
      return OWNER_PROSPECT;
    case EUserPropertyType.TENANT_PROSPECT:
      return EUserPropertyType.TENANT_PROSPECT;
    case EUserPropertyType.TENANT_PROPERTY:
      return EUserPropertyType.TENANT_PROPERTY;
    case EUserPropertyType.TENANT_UNIT:
      return EUserPropertyType.TENANT_UNIT;
    default:
      return role;
  }
};
