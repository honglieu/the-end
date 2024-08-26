import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import {
  ISecondaryEmail,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  IParticipant,
  IParticipantContact
} from '@shared/types/conversation.interface';
import { ERecognitionStatus, EUserPropertyType } from '@shared/enum';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { OtherContact } from '@shared/types/other-contact.interface';

const defaultOptions = {
  isNoPropertyConversation: false,
  isMatchingPropertyWithConversation: false,
  showOnlyRole: false,
  showFullContactRole: false,
  showOnlyName: false,
  showPrimaryText: false,
  showCrmStatus: false,
  skipClientName: false,
  showPMRole: false,
  showPMTitle: false
};

type IContact = Partial<
  ISelectedReceivers | IParticipantContact | IConversationLogUser
>;

export interface IConversationLogUser {
  firstName: string;
  lastName: string;
  type: string;
  id: string;
  idUserPropertyGroup: string;
  isTemporary?: boolean;
  phoneNumber: string;
  userPropertyId: string;
  userPropertyType: EUserPropertyType;
  email?: string;
  name?: string;
  originalEmailName?: string;
  contactType?: string;
  isPrimary?: boolean;
  recognitionStatus?: ERecognitionStatus;
  userTitle?: string;
  userProperty?: {
    idUserPropertyGroup: string;
    type: EUserPropertyType;
    userPropertyId: string;
    userPropertyContactType: {
      crmSystemId: string;
      type: string[];
    };
  };
  secondaryEmails?: { id: string; email: string }[];
  secondaryPhones?: { phoneNumber: string }[];
}

@Pipe({
  name: 'contactTitleByConversationProperty',
  pure: true
})
export class ContactTitleByConversationPropertyPipe
  implements PipeTransform, OnDestroy
{
  private isRmEnvironment: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private companyService: CompanyService,
    private agencyService: AgencyService
  ) {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }
  transform(
    contact: IContact,
    options: {
      isNoPropertyConversation: boolean;
      isMatchingPropertyWithConversation: boolean;
      showOnlyRole?: boolean;
      showFullContactRole?: boolean;
      showOnlyName?: boolean;
      showPrimaryText?: boolean;
      showCrmStatus?: boolean;
      skipClientName?: boolean;
      showPMRole?: boolean;
      showPMTitle?: boolean;
      isFacebookContact?: boolean;
    } = defaultOptions
  ): string {
    const {
      isNoPropertyConversation,
      isMatchingPropertyWithConversation,
      showOnlyRole,
      showFullContactRole,
      showOnlyName,
      showPrimaryText,
      showCrmStatus,
      skipClientName,
      showPMRole,
      showPMTitle,
      isFacebookContact
    } = options || {};

    const contactName = this.formatContactNameByProperty(contact, {
      isNoPropertyConversation,
      isMatchingPropertyWithConversation,
      skipClientName,
      isFacebookContact
    });

    if (showOnlyName) {
      return contactName;
    }

    const contactRole = this.formatConTactRoleByProperty(contact, {
      isNoPropertyConversation,
      isMatchingPropertyWithConversation,
      showOnlyRole,
      showFullContactRole,
      showPrimaryText,
      showCrmStatus,
      showPMRole,
      showPMTitle,
      isFacebookContact
    });

    if (showOnlyRole) {
      return contactRole;
    }

    return !!contactRole?.length
      ? `${contactName} (${contactRole})`
      : contactName;
  }

  private formatContactNameByProperty(
    contact: IContact,
    options: {
      isNoPropertyConversation: boolean;
      isMatchingPropertyWithConversation: boolean;
      skipClientName: boolean;
      isFacebookContact?: boolean;
    }
  ) {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      originalEmailName,
      emailVerified,
      recognitionStatus,
      isTemporary
    } = (contact || {}) as IContact & { emailVerified?: string };

    const contactType =
      (contact as IParticipantContact)?.userType ||
      (contact as IConversationLogUser)?.userProperty?.type ||
      contact?.type;

    let secondaryEmail: ISecondaryEmail;
    let sendFrom: string;

    if (contact && 'secondaryEmail' in contact) {
      secondaryEmail = contact.secondaryEmail;
    }

    if (contact && 'sendFrom' in contact) {
      sendFrom = (contact as unknown as OtherContact).sendFrom;
    }

    const {
      isNoPropertyConversation,
      isMatchingPropertyWithConversation,
      skipClientName,
      isFacebookContact
    } = options || {};

    // Common case for identified participant
    const identifiedParticipantTitle =
      firstName ||
      lastName ||
      sendFrom ||
      secondaryEmail?.email ||
      email ||
      phoneNumber ||
      '';

    if (skipClientName) {
      return firstName || lastName || phoneNumber || 'Unknown';
    }

    // Conditions for using name from DB
    if (
      ![
        EUserPropertyType.MAILBOX,
        EUserPropertyType.LEAD,
        EUserPropertyType.SUPPLIER,
        EUserPropertyType.OTHER
      ].includes(contactType as EUserPropertyType) &&
      (isNoPropertyConversation ||
        (!isNoPropertyConversation && !isMatchingPropertyWithConversation))
    ) {
      return (
        secondaryEmail?.email ||
        secondaryEmail?.originalEmailName ||
        originalEmailName ||
        (isFacebookContact
          ? recognitionStatus !== ERecognitionStatus.UNRECOGNIZED
            ? emailVerified
            : isTemporary
            ? 'Unknown'
            : email
          : email) ||
        phoneNumber ||
        firstName ||
        lastName ||
        'Unknown'
      ).trim();
    }

    return identifiedParticipantTitle.trim();
  }

  private formatConTactRoleByProperty(
    contact: IContact,
    options: {
      isNoPropertyConversation: boolean;
      isMatchingPropertyWithConversation: boolean;
      showOnlyRole?: boolean;
      showFullContactRole?: boolean;
      showPrimaryText?: boolean;
      showCrmStatus?: boolean;
      showPMRole?: boolean;
      showPMTitle?: boolean;
      isFacebookContact?: boolean;
    }
  ) {
    const {
      contactType,
      isTemporary,
      isPrimary,
      recognitionStatus,
      userTitle
    } = contact || {};

    const {
      isNoPropertyConversation,
      isMatchingPropertyWithConversation,
      showOnlyRole,
      showFullContactRole,
      showPrimaryText,
      showCrmStatus,
      showPMRole,
      showPMTitle,
      isFacebookContact
    } = options || {};

    const contactPropertyType = ((contact as IConversationLogUser)?.userProperty
      ?.type ||
      contact?.userPropertyType ||
      (contact as IParticipantContact)?.userType ||
      contact?.type) as EUserPropertyType;

    const contactCrmStatus = (contact as IParticipantContact)?.crmStatus;

    const userPropertyContactType =
      (contact as IConversationLogUser)?.userProperty
        ?.userPropertyContactType ||
      (contact as ISelectedReceivers | IParticipant)?.userPropertyContactType;

    if (contactPropertyType === EUserPropertyType.AI_ASSISTANT) {
      return 'AI Assistant';
    }

    if (EUserPropertyType.LEAD === contactPropertyType && showPMRole) {
      if (showPMTitle) {
        return userTitle ?? '';
      } else return 'PM';
    }

    if (
      [EUserPropertyType.MAILBOX, EUserPropertyType.LEAD].includes(
        contactPropertyType
      )
    )
      return '';

    // Always show role for Supplier and Other contacts
    if (contactPropertyType === EUserPropertyType.SUPPLIER) {
      const contactRole = EUserPropertyType.SUPPLIER;
      return showCrmStatus && contactCrmStatus === ECrmStatus.ARCHIVED
        ? this.formatTitleCase(contactCrmStatus + ' ' + contactRole)
        : this.formatTitleCase(contactRole);
    }

    if (contactPropertyType === EUserPropertyType.OTHER) {
      return this.formatTitleCase(contactType?.replace(/_/g, ' '));
    }

    // Handle no property conversation case
    if (isNoPropertyConversation) {
      // Handle no property conversation case + show special role for tooltip
      if ((showFullContactRole || showOnlyRole) && isTemporary) {
        const contactRole =
          recognitionStatus === ERecognitionStatus.UNRECOGNIZED
            ? isFacebookContact
              ? ''
              : EUserPropertyType.UNRECOGNIZED
            : '';

        return this.formatTitleCase(contactRole);
      }

      return '';
    }

    // Handle identified property conversation case + matching property conversation case
    if (isMatchingPropertyWithConversation) {
      const isOwnerRelated = [
        EUserPropertyType.OWNER,
        EUserPropertyType.LANDLORD,
        EUserPropertyType.LANDLORD_PROSPECT
      ].includes(contactPropertyType);

      const isTenantRelated = [
        EUserPropertyType.TENANT_UNIT,
        EUserPropertyType.TENANT_PROPERTY,
        EUserPropertyType.TENANT_PROSPECT,
        EUserPropertyType.TENANT
      ].includes(contactPropertyType);

      let userPropertyType = '';
      let userPropertyCategory = '';

      if (isOwnerRelated) {
        userPropertyType = EUserPropertyType.OWNER;
        userPropertyCategory = EUserPropertyType.OWNERSHIP;
      }

      if (isTenantRelated) {
        userPropertyType = EUserPropertyType.TENANT;
        userPropertyCategory = EUserPropertyType.TENANCY;
      }

      //Check to show contact type tag
      if (isOwnerRelated || isTenantRelated) {
        const contactTypeOrder = ['Emergency', 'Accountant', 'Other'];
        const mappedUserPropertyContactType =
          userPropertyContactType?.type
            ?.map(this.mapContactType)
            .sort(
              (a, b) =>
                contactTypeOrder.indexOf(a) - contactTypeOrder.indexOf(b)
            ) || [];

        const formattedUserPropertyType = this.formatTitleCase(
          this.formatSpecialUserPropertyType(
            contactPropertyType as EUserPropertyType
          )
        );

        const contactRole =
          mappedUserPropertyContactType.includes(
            this.formatTitleCase(userPropertyType)
          ) || this.isRmEnvironment
            ? isPrimary
              ? showFullContactRole || showPrimaryText
                ? this.formatTitleCase('Primary ' + formattedUserPropertyType)
                : formattedUserPropertyType
              : formattedUserPropertyType
            : showFullContactRole
            ? `${this.formatTitleCase(userPropertyCategory)} - ${
                mappedUserPropertyContactType?.length
                  ? mappedUserPropertyContactType.join('/ ')
                  : 'No contact type assigned'
              }`
            : this.formatTitleCase(userPropertyCategory);

        return showCrmStatus && contactCrmStatus === ECrmStatus.ARCHIVED
          ? this.formatTitleCase(contactCrmStatus + ' ' + contactRole)
          : contactRole;
      }

      return '';
    }

    // Handle identified property conversation case + no matching property conversation case + show special role for tooltip
    if (showFullContactRole || showOnlyRole) {
      const contactRole =
        !isTemporary && !!contactPropertyType
          ? EUserPropertyType.BELONGS_TO_OTHER_PROPERTIES.replace(/_/g, ' ')
          : recognitionStatus === ERecognitionStatus.UNRECOGNIZED
          ? isFacebookContact
            ? ''
            : EUserPropertyType.UNRECOGNIZED
          : EUserPropertyType.BELONGS_TO_OTHER_PROPERTIES.replace(/_/g, ' ');

      return this.formatTitleCase(contactRole);
    }

    // If not a no property conversation and no property match
    return '';
  }

  private mapContactType(type: string): string {
    const typeMappings: { [key: string]: string } = {
      emergency: 'Emergency',
      accountant: 'Accountant',
      other: 'Other'
    };

    const contactType = type.toLowerCase();

    for (const [key, value] of Object.entries(typeMappings)) {
      if (contactType.includes(key)) {
        return value;
      }
    }

    return type;
  }

  private formatTitleCase(input: string): string {
    return input.length === 0
      ? ''
      : input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
  }

  private formatSpecialUserPropertyType(
    userPropertyType: EUserPropertyType
  ): string {
    switch (userPropertyType) {
      case EUserPropertyType.LANDLORD:
        return EUserPropertyType.OWNER;
      case EUserPropertyType.LANDLORD_PROSPECT:
        return EUserPropertyType.OWNER_PROSPECT.replace(/_/g, ' ');
      case EUserPropertyType.TENANT_PROSPECT:
        return EUserPropertyType.TENANT_PROSPECT.replace(/_/g, ' ');
      case EUserPropertyType.TENANT_UNIT:
        return USER_TYPE_IN_RM.TENANT_UNIT.replace(/[()]/g, '');
      case EUserPropertyType.TENANT_PROPERTY:
        return USER_TYPE_IN_RM.TENANT_PROPERTY.replace(/[()]/g, '');
      default:
        return userPropertyType;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
