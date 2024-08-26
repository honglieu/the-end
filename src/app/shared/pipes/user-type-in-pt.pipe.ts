import { ENoteSaveToType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { EContactTypeUserProperty } from '@/app/user/list-property-contact-view/model/main';
import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum';

interface IContactInfo {
  contactType: string[];
  type: EUserPropertyType | string;
  isPrimary: boolean;
}

@Pipe({
  name: 'userTypeInPT'
})
export class UserTypeInPTPipe implements PipeTransform {
  transform(
    value: string,
    isPTEnvironment: boolean,
    contactInfo: IContactInfo,
    isShortType: boolean = false,
    isExcludedGroupName: boolean = false
  ): string {
    if (
      !isPTEnvironment ||
      ![EUserPropertyType.LANDLORD, EUserPropertyType.TENANT].includes(
        contactInfo.type as EUserPropertyType
      )
    ) {
      return value;
    }
    const contactTypes = contactInfo.contactType?.join()?.toLowerCase() || [];
    const isIncludeTenant = contactTypes.includes(
      EContactTypeUserProperty.TENANT.toLowerCase()
    );
    const isIncludeOwner = contactTypes.includes(
      EContactTypeUserProperty.OWNER.toLowerCase()
    );
    const isIncludeEmergency = contactTypes.includes(
      EContactTypeUserProperty.EMERGENCY_CONTACT.toLowerCase()
    );
    const isIncludeOther = contactTypes.includes(
      EContactTypeUserProperty.OTHER.toLowerCase()
    );
    const isIncludeAccountant = contactTypes.includes(
      EContactTypeUserProperty.ACCOUNTANT.toLowerCase()
    );
    const isLandlordType = contactInfo.type === EUserPropertyType.LANDLORD;
    const isPrimary = contactInfo.isPrimary;

    const currentPropertyType = isLandlordType
      ? EContactTypeUserProperty.OWNER
      : EContactTypeUserProperty.TENANT;

    const showPropertyType = isPrimary
      ? currentPropertyType.toLocaleLowerCase()
      : currentPropertyType;

    const groupName = isLandlordType
      ? ENoteSaveToType.OWNERSHIP
      : ENoteSaveToType.TENANT;

    const hasAnyOtherType =
      isIncludeEmergency ||
      isIncludeOther ||
      (isLandlordType ? isIncludeAccountant : false);

    const isIncludeCurrentContactType = isLandlordType
      ? isIncludeOwner
      : isIncludeTenant;

    const listContactTypes = [
      isIncludeEmergency ? 'Emergency' : '',
      isIncludeAccountant ? 'Accountant' : '',
      isIncludeOther ? 'Other' : ''
    ]
      .filter(Boolean)
      .join('/ ');

    const noContactTypeAssigned = 'No contact type assigned';
    const showGroupName = isExcludedGroupName ? '' : `${groupName} - `;

    if (isIncludeCurrentContactType) {
      return `${isPrimary ? 'Primary ' : ''}${showPropertyType}`;
    } else if (!isIncludeCurrentContactType && hasAnyOtherType) {
      if (isShortType) return groupName;
      return `${showGroupName}${listContactTypes}`;
    }

    return isShortType ? groupName : `${showGroupName}${noContactTypeAssigned}`;
  }
}
