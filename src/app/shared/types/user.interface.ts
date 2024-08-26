import { ERecurringCharge } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import {
  EInviteStatus,
  ERecognitionStatus,
  ERmCrmStatus,
  EUserPropertyType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { IFile } from '@shared/types/file.interface';
import { EContactTypeUserProperty } from '@/app/user/list-property-contact-view/model/main';
import { Property } from './property.interface';
import { ISecondaryPhone } from '@/app/user/utils/user.type';
import { EConversationType } from '../enum';

export interface BankAccount {
  id?: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  agencyId: string;
  tempAccount?: boolean;
  agency?: {
    id: string;
    name: string;
  };
}

interface UserPropertyCurrent {
  id: string;
  userId: string;
  type: string;
  propertyAgreementId: string;
  status: string;
  vacatedAt?: any;
  propertyId: string;
  isPrimary?: any;
  idUserPropetyTree: string;
  idUserPropertyGroup?: any;
}

export interface UserProp {
  checked: boolean;
  propertyId: string;
  type: string;
  userId: string;
}

export interface IAdministrator {
  id: string;
  firstName: string;
  lastName: string;
  googleAvatar: string;
  email: string;
}

export interface ICurrentUser {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  status: string;
  type: string;
  lastActivity?: string;
  iviteSent?: string;
  acceptedTermsConditions?: any;
  googleAvatar?: string;
  isEmergencyContact?: boolean;
  firstActive?: any;
  trudiUserId?: any;
  isAdministrator: boolean;
  isMeetTheTeam: boolean;
  title: string;
  userProperties: UserPropertyCurrent[];
  bankAccount?: BankAccount;
  isAgencyAdmin: boolean;
  agencyAgents?: CompanyAgentCurrentUser[];
}

export interface User {
  firstName: string;
  lastName: string;
  iviteSent?: string;
  lastActivity?: string;
  id: string;
  offBoardedDate?: any;
  statusInvite?: string;
  shortName?: string;
  phoneNumber?: string;
  mobileNumber?: string[];
  email?: string;
  isInCalling?: boolean;
  trudiUserId?: string | null;
  secondaryEmails?: ISecondaryEmails[];
  secondaryPhones?: ISecondaryPhone[];
  status?: string;
  type?: string;
  isSystemCreate?: boolean;
  inviteStatus?: EInviteStatus;
}

export interface ISecondaryEmails {
  id: string;
  email: string;
  propertyId: string;
}

interface UserProperty {
  isPrimary: boolean;
  type: string;
  id: string;
  propertyId: string;
  user: User;
  isAcceptedPermission?: boolean;
  status?: ERmCrmStatus;
  isReceiveAutomaticInvoices?: boolean;
  email?: string;
  contactType?: {
    crmSystemId: string;
    type: EContactTypeUserProperty[];
  };
}

interface UserPropertyGroupLease {
  startDate: string;
  endDate?: any;
  vacateDate?: any;
  originalLeaseStartDate: string;
}

export interface PropertyManager {
  id: string;
  type: string;
  user: User;
  status: string;
  propertyId: string;
  isAcceptedPermission?: boolean;
  firstName: string;
  lastName: string;
  googleAvatar: string;
  selected?: boolean;
}

export interface IPropertyInfo {
  propertyId: string;
  streetline: string;
}

export interface Personal {
  id: string;
  idCRMSystem?: string;
  idPropertyTree?: string;
  name?: string;
  type: 'TENANCY' | 'OWNERSHIP' | 'AGENT';
  status: string;
  userProperties?: UserProperty[];
  user?: User;
  propertyId?: string;
  userPropertyGroupLeases?: any[];
  arrears?: any[];
  isAcceptedPermission?: boolean;
  recurringCharges?: ERecurringCharge[];
  bondAmountRequired?: number;
  nextRentAmount?: number;
  nextRentReviewDate?: Date;
  dayRentInArrears?: number;
  rentPaidToDate?: string;
  movingOutDate?: string;
  totalOutStandingInvoice?: number;
}

export interface IUserTenancy {
  id: string;
  idCRMSystem?: string;
  idPropertyTree?: string;
  name?: string;
  type: 'TENANCY' | 'OWNERSHIP' | 'AGENT';
  status: string;
  userProperties?: UserProperty[];
  user?: User;
  propertyId?: string;
  userPropertyGroupLeases?: IUserPropertyGroupLeases[];
  arrears?: IArrears[];
  isAcceptedPermission?: boolean;
  recurringCharges?: ERecurringCharge[];
  bondAmountRequired?: number;
  nextRentAmount?: number;
  dayRentInArrears?: number;
  rentPaidToDate?: string;
  movingOutDate?: string;
  totalOutStandingInvoice?: number;
  nextInspection?: Date | null;
}

interface IUserPropertyGroupLeases {
  id: string;
  idUserPropertyGroup: string;
  startDate: Date | null;
  endDate: Date | null;
  vacateDate: Date | null;
  originalLeaseStartDate: Date | null;
  rentAmount: number | null;
  frequency: null;
  leasePeriod: string;
  leasePeriodType: string;
  dueDay: number | null;
  source: null;
  paidTo: Date | null;
  dayRemaining: number;
}

interface IArrears {
  id: string;
  idUserPropertyGroup: string;
  type: string;
  amount: number;
  daysInArrears: number;
  effectiveArrearsAmount: null;
  updatedAt: Date;
}

export interface IPersonalInTab {
  tenancies: Personal[];
  ownerships: Personal[];
  propertyManagers: Personal[];
  parentTenancies: Personal[];
}

export interface UserPropInSelectPeople {
  checked?: boolean;
  firstName?: string;
  groupId?: string;
  id: string;
  inviteSent?: string;
  lastActivity?: string;
  lastName?: string;
  offBoarded?: any;
  propertyId?: string;
  status?: string;
  type?: string;
  userPropertyId?: string;
  actionType?: string;
  email?: string;
  trudiUserId?: string | null;
}

export interface UserInSelectPeople
  extends Omit<UserPropInSelectPeople, 'status'> {
  isPrimary?: boolean;
  status?: string;
}

export interface UserInMessagePopup {
  state: boolean;
  item?: UserItemInMessagePopup | any;
}

export interface UserItemInMessagePopup {
  id: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  inviteSent?: string;
  lastActivity?: string;
  offBoarded?: string;
  propertyId?: string;
  userPropertyId?: string;
  groupId?: string;
  checked?: boolean;
  isPrimary?: boolean;
  email?: string;
}

export interface ActiveUserProps {
  tenant: UserPropertyDetail[];
}

export interface UserPropertyDetail {
  id: string;
  avatar: string;
  firstName: string;
  lastName: string;
  userpropertyid?: string;
  isChecked: boolean;
  isPrimaryTenant: any;
  userPropertyId?: string;
}

export interface UserProperties {
  id?: any;
  userId?: any;
  type?: any;
  propertyAgreementId?: any;
  status?: any;
  vacatedAt?: any;
  propertyId?: any;
  isPrimary?: any;
  idUserPropetyTree?: any;
  idUserPropertyGroup?: any;
  contactType?: string;
}

export interface CompanyAgentCurrentUser {
  isAgencyAdmin: boolean;
  isMeetTheTeam: boolean;
  isAssignedToMultipleMailBox: boolean;
  role: string;
  mailBoxes: IMailBox[];
  mailBoxesNotShared?: IMailBox[];
  companyId: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  type: string | UserTypeEnum;
  lastActivity: Date;
  iviteSent?: any;
  acceptedTermsConditions?: any;
  googleAvatar: string;
  isEmergencyContact: boolean;
  firstActive?: any;
  trudiUserId?: any;
  isMeetTheTeam: boolean;
  title: string;
  offBoardedDate?: any;
  userProperties: UserProperties;
  isAdministrator: boolean;
  isAgencyAdmin: boolean;
  idUserPropetyTree: string;
  reiToken?: string;
  mobileNumber: string;
  bankAccounts?: BankAccount[];
  companyAgents?: CompanyAgentCurrentUser[];
  userOnboarding: IUserOnboarding;
  imageSignature?: IImageSignature;
  isTemporary?: boolean;
}

export interface IImageSignature extends IFile {
  imageSize: IImageSize;
  sliderValue: number;
}

export interface IImageSize {
  width: number;
  height: number;
}

export interface IUserOnboarding {
  useDefaultFocusView?: boolean;
  showMoveMessageWarning?: boolean;
  showViewSettings?: boolean;
  showPolicyDetection?: boolean;
}

export interface AssignedTopic {
  id?: string;
  podId?: string;
  name: string;
  isAssigned: boolean;
}

export interface TargetFromFormMessage {
  avatar: string;
  id: string;
  index: number;
  name: string;
  title: string;
  firstName?: string;
  lastName?: string;
  mailBoxId?: string;
}

export interface CountUser {
  Tenant: number;
  Landlord: number;
  PropManager: number;
  Supplier: number;
}

export interface UsersEmailNotification {
  id?: string;
  newEnquiries?: boolean;
  taskAssignedToMe?: boolean;
  unidentifiedEnquiries?: boolean;
  updateMyTask?: boolean;
  callTranscriptions?: boolean;
  userId?: string;
}

export interface SupplierPT {
  id: string;
  firstName: any;
  lastName: string;
  email: string;
  type: string;
  accountCode: string;
  creditorReference: string;
  agencyAgents: AgencyAgent[];
}

export interface ISupplier extends SupplierPT {
  phoneNumber: number;
  landingPage: string;
  googleAvatar: string;
  supplierType: string;
  isEmergencyContact: boolean;
  isFavourite: boolean;
  isSystemCreate: boolean;
  mobileNumber: number;
  secondaryEmails: {
    id: string;
    email: string;
  }[];
  checked: boolean;
  propertyId: string;
}

export interface AgencyAgent {
  id: string;
}

export interface CreateNewContactUserResponse {
  id: string;
  inviteViaConversation: boolean;
  canInviteViaConversation: boolean;
  isMeetTheTeam: boolean;
  isActive: boolean;
  isAgencyAdmin: boolean;
  isTemporary: boolean;
  email: string;
  firstName?: any;
  lastName: string;
  type: string;
  contactType: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  password?: any;
  phoneNumber?: any;
  googleId?: any;
  pin?: any;
  landingPage?: any;
  idVerification?: any;
  bankAccountDetails?: any;
  cardDetails?: any;
  lastActivity?: any;
  resetToken?: any;
  iviteSent?: any;
  avatar?: any;
  avatarId?: any;
  acceptedTermsConditions?: any;
  googleAvatar?: any;
  isTrudiMuted?: any;
  passCode: boolean;
  isEmergencyContact: boolean;
  idUserPropetyTree?: any;
  firstActive?: any;
  trudiUserId?: any;
  title?: any;
  offBoardedDate?: any;
  accountCode?: any;
  portfolioCount?: any;
  creditorReference?: any;
  onboardTracking?: any;
}

export interface NotificationSettingApiResponse {
  emailSettings: PlatformSettings;
  desktopSettings: PlatformSettings;
}

export interface PlatformSettings {
  id: string;
  messageTaskAssignedMe: boolean;
  newMessageTaskReply: boolean;
  messagesResolvedByTrudi: boolean;
  unassignedMessageTask: boolean;
  platform: string;
  newSharedMailBox: boolean;
  newRequest: boolean;
}

export interface IMailBox {
  id: string;
  name: string;
  emailAddress: string;
  status: EMailBoxStatus;
  picture?: string;
  agencyID?: string;
  role?: Array<keyof typeof EUserMailboxRole>;
  lastTimeSync?: string;
  type?: EMailBoxType;
  isDefault?: boolean;
  incomingEmail?: string;
  outgoingEmail?: string;
  description?: string;
  provider?: string;
  spamFolder: SpamFolder;
  mailBoxOwnerAddress?: string;
  mailBoxOwnerId?: string;
  isMailboxCompany?: boolean;
  isOpen?: boolean;
  mailBoxId?: string;
  isNew?: boolean;
  orderId?: string;
  order: number;
  totalItem: {
    totalItemCount: number;
    totalMessageSynced: number;
  };
}

export interface SpamFolder {
  id: string;
  name: string;
  delimiter: string;
  mailBoxId?: string;
  externalId?: string;
}

export type TypeMailPermissions = {
  id: string;
  companyAgent: {
    id: string;
    user: {
      firstName?: string;
      lastName?: string;
      title?: string;
      email: string;
    };
  };
};

export interface IMailBoxAssignee {
  id: string;
  name: string;
  emailAddress: string;
  mailPermissions: TypeMailPermissions[];
}

export interface Portfolio {
  agencyAgentId?: string;
  agencyId?: string;
  agencyName?: string;
  id: string;
  firstName: string;
  lastName: string;
  googleAvatar: string;
  fullName?: string;
  selected?: boolean;
  label?: string;
  isFollowed?: boolean;
  portfolioCount?: number;
}

export interface PortfolioEx extends Portfolio {
  portfolioCount: number;
}

export interface IUserParticipant {
  id: string;
  userId: string;
  isPrimary: boolean;
  type: EUserPropertyType;
  shortenStreetline: string;
  streetline: string;
  supplierType: string;
  mobileNumber: string[];
  trudiUserId: string;
  offBoardedDate: string;
  lastActivity: string;
  iviteSent: string;
  googleAvatar: string;
  phoneNumber: string;
  lastName: string;
  email: string;
  firstName: string;
  userPropertyId: string;
  isTemporary: boolean;
  propertyId: string;
  userPropertyType?: string;
  contactType?: string;
  participantId: string;
  emailVerified?: string;
  determineUserType: string;
  generateUserName: string;
  isMultipleContact: boolean;
  secondaryEmail?: string;
  secondaryEmailId?: string;
  oldUserId?: string;
  userType?: EUserPropertyType;
  phoneNumberFromConversationLog: string;
  isReassign?: boolean;
  crmStatus?: string;
  secondaryPhoneNumber?: string;
  userPropertyContactType?: IUserPropertyContactType;
  recognitionStatus?: ERecognitionStatus;
  pmName?: string;
  name?: string;
  channelUser: {
    externalId: string;
  };
  conversationType?: EConversationType;
  fromPhoneNumber?: string;
  createdFrom?: ECreatedFrom;
  originalEmailName?: string;
}

export interface IUserPropertyContactType {
  crmSystemId: string;
  type: string[];
}
export interface IPersonalInProperty {
  tenancies?: Personal[];
  owners?: Personal[];
  ownership?: Personal;
  propertyId?: string;
  propertyData?: Property;
  filterOfTenancies?: boolean;
  filterOfOwners?: boolean;
}

export interface ITrustAccountPayload {
  id?: string;
  agencyId: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
}
