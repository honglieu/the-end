import { SecondaryEmail } from '@shared/types/users-by-property.interface';
export const REGEX_NUMBER = /^\d+|[+()]/;

export const USER_PROPERTY_TYPE = {
  OWNERSHIP: 'OWNERSHIP',
  TENANCY: 'TENANCY'
};

export enum EContactPageType {
  RM = 'RENT_MANAGER',
  PT = 'PROPERTY_TREE'
}

export enum ETypeContactItem {
  PROPERTY = 'Property',
  OWNER = 'Owner',
  TENANT = 'Tenant',
  UNIT = 'Unit',
  CONTACT = 'Contact'
}

export enum EUserPropertyTypeInContactPage {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD'
}

export enum EContactTypeUserProperty {
  TENANT = 'Tenant',
  OWNER = 'Owner',
  EMERGENCY_CONTACT = 'EmergencyContact',
  ACCOUNTANT = 'Accountant',
  SUPPLIER = 'Supplier',
  PROPERTY_MANAGER = 'Property manager',
  OTHER = 'Other',
  OTHER_CONTACT = 'Other contact'
}

export interface IContactItemFormatted<T> {
  dataType: ETypeContactItem;
  isChecked?: boolean;
  data: T;
}

export interface ISendIvitedUser {
  userId: string;
  propertyId: string;
  date: string;
}

export interface IAgentUserProperties {
  streetline: string;
  status: string;
  propertyId: string;
  displayAddress: string;
  sourceProperty?: ISourceProperty;
  userPropertyGroups: IUserPropertyGroup[];
  order?: number;
  userId?: string;
  secondaryEmails?: SecondaryEmail[];
}

export interface ISourceProperty {
  propertyName?: string;
  externalPropertyId?: number;
  externalUnitId?: number;
  type?: string;
  userId?: string;
  propertyId: string;
  secondaryEmails?: SecondaryEmail[];
  streetline?: string;
}

export interface IUserPropertyGroup {
  id: string;
  title?: string;
  name: string;
  status: string;
  type: string;
  displayTitle?: string;
  userProperties: IUserProperties[];
  secondaryEmails?: SecondaryEmail[];
  userId?: string;
  propertyId: string;
  streetline?: string;
}

export interface IUserProperties {
  userPropertyId: string;
  userId: string;
  type?: string;
  status: string;
  propertyId: string;
  email: string;
  secondaryEmails: SecondaryEmail[];
  secondaryPhones: [];
  lastActivity: string;
  firstName: string;
  lastName: string;
  phoneNumbers: [];
  unconfirmedChangeEmail: string;
  inviteStatus: string;
  inviteSent: string;
  user?: IUserProperty;
  source?: ISourceUserProperty;
  isPrimary?: boolean;
  displayType?: string;
  iviteSent?: string;
  contactType?: string[];
  fullName?: string;
  streetline?: string;
}

export interface IUserProperty {
  id: string;
  idUserPropertyTree: string;
  email: string;
  lastActivity: string;
  firstName: string;
  lastName: string;
  inviteSent: string;
  offBoardedDate: string;
  mobileNumber: string;
  source: ISourceUserProperty;
  createdAt: string;
  changedUserEmail: string;
  secondaryEmails: [];
  secondaryPhones: [];
}

export interface ISourceUserProperty {
  sourceKey: string;
  externalId: number;
}
