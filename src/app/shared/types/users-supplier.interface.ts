import { SecondaryEmail } from './users-by-property.interface';

export interface SupplierProperty {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  mobileNumber: string;
  email: string;
  isEmergencyContact: boolean;
  isFavourite: boolean;
  landingPage: string;
  googleAvatar: string;
  secondaryEmails: SecondaryEmail[];
  userIndexRowspan?: number;
  isSystemCreate?: boolean;
  type: string;
  supplierType?: string;
  status?: string;
  fullName?: string;
}

export interface ISupplierBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isFavourite: boolean;
}
export interface IUsersSupplierBasicInfoProperty {
  suppliers: ISupplierBasicInfo[];
  totalPages: number;
  currentPage: number;
}
export interface UsersSupplierProperty {
  list: SupplierProperty[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  currentPageCount: number;
}

export interface SupplierSendedQuote {
  conversationId: string;
  id: string;
  firstName: string;
  phoneNumber: string;
  title: string;
  email: string;
  type: string;
  lastName: string;
  landingPage: string;
}

export interface IInputToGetSupplier {
  page?: number;
  size?: number;
  search: string;
  email_null: boolean;
  onlySyncData?: boolean;
  userIds?: Array<number>;
  crmSystemId?: string;
  propertyId?: string;
  agencyId?: string;
}
