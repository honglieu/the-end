import {
  EConversationType,
  EUserPropertyType,
  UserTypeEnum
} from '@shared/enum';
import { AssignToAgent } from '..';

export interface AgencyProperty {
  inviteStatus: string;
  agencyId: string;
  agencyName: string;
  logo: string;
}

export interface CheckedUser {
  status: boolean;
  listUser: [
    {
      propertyId: string;
      userId: string;
    }
  ];
}

export interface SecondaryEmail {
  email?: string;
  id: string;
  createdAt?: string;
  userId?: string;
  propertyId?: string;
  assignToAgents?: AssignToAgent[];
}

export interface SecondaryPhone {
  phoneNumber?: string;
  id: string;
}
export interface UserMessenger {
  name: string;
  email: string;
  id: string;
  type: string;
}

export interface UserWhatsApps {
  externalId: string;
  email: string;
  id: string;
  type: string;
}

export interface UserProperty {
  uuid?: string;
  userPropertyId: string;
  userId: string;
  type: string;
  status: string;
  email: string;
  propertyId: string;
  lastActivity: any;
  firstName: string;
  lastName: string;
  unconfirmedChangeEmail: string;
  secondaryEmails: SecondaryEmail[];
  secondaryPhones: SecondaryPhone[];
  userMessengers?: UserMessenger[];
  userWhatsApps?: UserWhatsApps[];
  inviteStatus: string;
  phoneNumbers: string[];
  checked: boolean;
  iviteSent: string | Date;
  id: string;
  mobileNumber: string[];
  source: Source;
  displayStatus?: string;
  landingPage?: string;
  phoneNumber?: string;
  channelUserId?: string;
  googleAvatar?: string;
  fullName?: string;
  streetline: string;
  idUserPropertyTree?: string;
  isSystemCreate?: boolean;
  sendFrom?: string;
  secondaryEmailId?: string;
  contactType?: string;
  isFavourite?: boolean;
  messageUserName?: string;
  emailVerified?: string;
  isUserVerified?: boolean;
  createdFrom?: string;
  taskId?: string;
  userPropertyContactType: {
    crmSystemId: string;
    type: string[];
  };
  isPrimary?: boolean;
  userPropertyType?: string;
  isAppUser?: boolean;
  role?: string;
  companyAgents?: {
    role: string;
  };
  userType?: EUserPropertyType;
  title?: string;
  sendFromUserType?: UserTypeEnum;
  conversationType: EConversationType;
  channelUser?: {
    externalId?: string;
  };
  recognitionStatus: string;
  userSendType: string;
}

export interface IAgency {
  agencyProperties: AgencyProperty[];
  streetline: string;
  id?: string;
  status: string;
  propertyId: string;
  currentPropertyAgreementId: string;
  userProperties: UserProperty[];
  sourceProperty?: {
    externalPropertyId: string;
    externalUnitId: string;
    propertyId: string;
    propertyName: string;
    type: 'Property' | 'Unit';
  };
  propertyManager: {
    firstName: string;
    lastName: string;
  };
}

export interface Source {
  sourceKey: string;
  externalLanlordProspectId: number;
  numUnit: number;
  crmStatus?: string;
  isProspect: boolean;
  type: string;
}

export interface Source {
  sourceKey: string;
  externalLanlordProspectId: number;
  numUnit: number;
  crmStatus?: string;
  isProspect: boolean;
  type: string;
}

export interface UsersByProperty {
  listAgencies: IAgency[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
