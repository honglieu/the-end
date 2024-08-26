import {
  EFilterType,
  EInviteStatus,
  ERmCrmStatus,
  ERoleCRM,
  EUserPropertyType
} from '@shared/enum/user.enum';
import { IPersonalInTab, User } from '@shared/types/user.interface';
import { EActionUserType, ECrmStatus, ERentPropertyStatus } from './user.enum';
import { Property } from '@shared/types/property.interface';
import { EConversationType, ECreatedFrom } from '@shared/enum';

export interface eventData {
  type: EActionUserType;
  data?: any;
  invite?: IInviteStatus;
  contactPageType?: string;
}

export interface EPagination {
  pageIndex?: number;
  pageSize?: number;
}

export interface IInviteStatus {
  status?: Boolean;
  isSendInvite?: Boolean;
}
export interface ITableColumns {
  key: string;
  label: string;
}

export interface ISecondaryEmail {
  id: string;
  userId: string;
  email: string;
  propertyId: string;
}

export interface ISecondaryPhone {
  id: string;
  phoneNumber: string;
  propertyId: string;
  userId: string;
}

export interface ITriggerEventFilter {
  isTrigger: boolean;
  pageSize?: number;
  pageIndex?: number;
}

export interface IDependency {
  role: string;
  status: string;
  email: string;
  secondaryEmails: ISecondaryEmail[];
  firstName: string;
  lastName: string;
  inviteSent: string;
  lastActivity: string;
  phoneNumbers: string[];
  checked?: Boolean;
  secondaryPhones: ISecondaryPhone[];
  id?: string;
  userPropertyId: string;
}

export interface IProperty {
  id: string;
  name?: string;
  streetline?: string;
  dependencies: IDependency[];
}

export interface ParamsTenantsLandlords {
  page: string;
  paramMts: string;
  inviteStatus: string;
  agencyId: string;
  crmStatus: string;
  time: string;
  search: string;
  portfolioUserId: string;
  roleTypes: string;
  propertyStatus: string;
}

export interface ParamsTenantLandlordsProspect {
  page: number;
  size: number;
  crmStatus: string[];
  search: string;
}

export interface ParamsSuppliers {
  page: number;
  agencyIds: string[];
  crmStatus: string;
  search: string;
}

export interface IPayloadGetUserProperty {
  userId: string;
  propertyId: string;
}

export const FILTER_TYPE_TENANT_OWNER = {
  [EFilterType.CRM]: { key: 'CRM', field: 'text', target: 'prevListCrm' },
  [EFilterType.PORTFOLIO]: {
    key: 'PORTFOLIO',
    field: 'id',
    target: 'prevListPortfolio'
  },
  [EFilterType.ROLES]: {
    key: 'ROLES',
    field: 'text',
    target: 'prevListRoles'
  },
  [EFilterType.STATUS]: {
    key: 'STATUS',
    field: 'text',
    target: 'prevListListInviteStatus'
  },
  [EFilterType.LAST_IMPORT]: {
    key: 'LAST_IMPORT',
    field: 'value',
    target: 'prevListLastTime'
  },
  [EFilterType.PROPERTY_STATUS]: {
    key: 'PROPERTY_STATUS',
    field: 'text',
    target: 'prevListPropertyStatus'
  },
  [EFilterType.AGENCIES]: {
    key: 'AGENCIES',
    field: 'id',
    target: 'prevListAgencies'
  }
};

export const itemPerRowOptions = [
  {
    id: 1,
    text: 10
  },
  {
    id: 2,
    text: 20
  },
  {
    id: 3,
    text: 50
  },
  {
    id: 4,
    text: 100
  }
];

export const TABLE_COLUMN_LANDLORDS_PROSPECT_RM = [
  {
    key: 'name',
    label: 'Name'
  },
  {
    key: 'crmStatus',
    label: 'CRM status'
  },
  {
    key: 'numUnit',
    label: 'Number of units'
  },
  {
    key: 'property_email',
    label: 'Email'
  },
  {
    key: 'phone_number',
    label: 'Phone number'
  },
  {
    key: 'account',
    label: 'Account'
  }
];

export const LIST_DATE_FILTER = [
  {
    id: 1,
    name: 'Last 24 hrs',
    value: '24h',
    data: 'last-24hrs'
  },
  {
    id: 2,
    name: 'Last 7 days',
    value: '7d',
    data: 'last-7days'
  },
  {
    id: 3,
    name: 'Last 30 days',
    value: '30d',
    data: 'last-30days'
  },
  {
    id: 4,
    name: 'Last 90 days',
    value: '90d',
    data: 'last-90days'
  }
];

export enum ECrmSystem {
  RENT_MANAGER = 'RENT_MANAGER',
  PROPERTY_TREE = 'PROPERTY_TREE'
}

export const CRM_STATUS_LANLORDS_PROSPECT = [
  {
    id: 1,
    text: 'Owner',
    status: 'RM_CRM_LANDLORD'
  },
  {
    id: 2,
    text: 'Owner prospect',
    status: 'PROSPECT'
  },
  {
    id: 3,
    text: 'Lost',
    status: 'RM_CRM_LOST'
  },
  {
    id: 4,
    status: 'RM_CRM_LOST_REJECTED',
    text: 'Lost - rejected'
  }
  // {
  //   id: 5,
  //   status: 'DELETED',
  //   text: 'Deleted'
  // }
];

export const CRM_STATUS_TENANTS_PROSPECT = [
  {
    id: 1,
    status: 'RM_CRM_TENANT',
    text: 'Tenant'
  },
  {
    id: 2,
    status: 'PROSPECT',
    text: 'Prospect'
  },
  {
    id: 3,
    status: 'RM_CRM_LOST',
    text: 'Lost'
  },
  {
    id: 4,
    status: 'RM_CRM_LOST_REJECTED',
    text: 'Lost - rejected'
  }
  // {
  //   id: 5,
  //   status: 'DELETED',
  //   text: 'Deleted'
  // }
];
export interface IItemFilter {
  id: number;
  status: ERentPropertyStatus | ERmCrmStatus | EInviteStatus | ERoleCRM;
  text: string;
}

export const propertyStatus: IItemFilter[] = [
  { id: 1, status: ERentPropertyStatus.ACTIVE, text: 'Active' },
  { id: 2, status: ERentPropertyStatus.INACTIVE, text: 'Inactive' },
  { id: 3, status: ERentPropertyStatus.DELETED, text: 'Deleted' }
];

export const crmStatus: IItemFilter[] = [
  { id: 1, status: ERmCrmStatus.RMPast, text: 'Past' },
  { id: 2, status: ERmCrmStatus.RMFuture, text: 'Future' },
  { id: 3, status: ERmCrmStatus.RMCurrent, text: 'Current' },
  { id: 4, status: ERmCrmStatus.RMDeleted, text: 'Deleted' }
];

export const inviteFilterList: IItemFilter[] = [
  { id: 1, status: EInviteStatus.ACTIVE, text: 'Active' },
  { id: 2, status: EInviteStatus.INVITED, text: 'Invited' },
  { id: 3, status: EInviteStatus.UNINVITED, text: 'Uninvited' },
  { id: 4, status: EInviteStatus.OFFBOARDED, text: 'Offboarded' }
];

export const roleFilterList: IItemFilter[] = [
  { id: 1, status: ERoleCRM.TenantUnit, text: 'Tenant (unit)' },
  { id: 2, status: ERoleCRM.TenantProperty, text: 'Tenant (property)' },
  { id: 3, status: ERoleCRM.Landlord, text: 'Owner' }
];
export const TABLE_COLUMN_TENANT_PROSPECT = [
  {
    key: 'property',
    label: 'Interested property'
  },
  {
    key: 'people',
    label: 'Name'
  },
  {
    key: 'crmStatus',
    label: 'CRM status'
  },
  {
    key: 'error',
    label: ''
  },
  {
    key: 'property_email',
    label: 'Email'
  },

  {
    key: 'phone_number',
    label: 'Phone number'
  },
  {
    key: 'account',
    label: 'Account'
  }
];

export interface IOtherContactFilter {
  page?: number;
  size?: number;
}

export const isLandlordOrTenant = (userType: EUserPropertyType) =>
  [
    EUserPropertyType.TENANT,
    EUserPropertyType.LANDLORD,
    EUserPropertyType.TENANT_UNIT,
    EUserPropertyType.TENANT_PROPERTY
  ].includes(userType);

export const isSupplier = (userType: EUserPropertyType) =>
  [
    EUserPropertyType.SUPPLIER,
    EUserPropertyType.TENANT_PROSPECT,
    EUserPropertyType.LANDLORD_PROSPECT
  ].includes(userType);

export const isSupplierOrOther = (userType: EUserPropertyType) =>
  isSupplier(userType) || EUserPropertyType.OTHER === userType;

export const isSupplierOrOtherOrExternal = (userType: EUserPropertyType) =>
  isSupplierOrOther(userType) || EUserPropertyType.EXTERNAL === userType;

export const isNoProperty = (userType: EUserPropertyType) =>
  isSupplierOrOtherOrExternal(userType) ||
  userType === EUserPropertyType.UNIDENTIFIED;

export const tenancyRMFilter = [
  ERmCrmStatus.RMPast,
  ERmCrmStatus.RMCurrent,
  ERmCrmStatus.RMFuture
];

export const getFilteredAndMappedTenancies = (
  res: IPersonalInTab,
  filterList?: string[],
  existedLease: boolean = true
) => {
  let tenancyList = [...(res?.tenancies || [])];
  if (filterList) {
    tenancyList = tenancyList.filter((tenant) =>
      filterList.includes(tenant.status)
    );
  }
  if (existedLease) {
    tenancyList = tenancyList.filter(
      (tenant) => tenant.userPropertyGroupLeases?.length > 0
    );
  }

  return tenancyList
    .sort((a, b) => a?.name?.localeCompare(b?.name))
    .map((item) => ({
      ...item,
      label: item.name,
      value: item.id
    }));
};

export interface IUserPropertyV2 {
  displayType?: string | string[];
  id: string;
  userId: string;
  type: string;
  propertyAgreementId: string;
  status: string;
  vacatedAt: string;
  propertyId: string;
  taskId?: string;
  isPrimary: true;
  idUserPropetyTree: string;
  idUserPropertyGroup: string;
  idMRI: string;
  isPropertyManagerContact: boolean;
  source: null;
  createdAt: string;
  updatedAt: string;
  user: User;
  property: Property;
  userPropertyGroup: IUserPropertyGroup;
  isAssigned?: boolean;
  isMatchesProperty?: boolean;
  isMatchesException?: boolean;
  isMatchesLead?: boolean;
  streetline?: string;
  userType?: string;
  email?: string;
  secondaryEmails?: ISecondaryEmail;
  contactType?: {
    crmSystemId: string;
    type: string[];
  };
  createdFrom?: ECreatedFrom;
  fromPhoneNumber?: string;
  isSuggested?: boolean;
  crmStatus?: ECrmStatus;
  conversationId?: string;
  conversationPropertyId?: string;
  isTemporaryProperty?: boolean;
  emailVerified?: string;
  conversationType?: EConversationType;
  isUserVerified?: boolean;
  isBelongToOtherContact?: boolean;
  pmNameClick: boolean;
  currentPMJoined?: boolean;
}

export interface IUserPropertyGroup {
  id: string;
  name: string;
  type: string;
  status: string;
  source: null;
  lease: IUserPropertyGroupLeases;
}

export interface IUserPropertyGroupLeases {
  id: string;
  startDate: string;
  endDate: string;
  moveInDate: string;
  vacateDate: string;
  expectedMoveOutDate: string;
  noticeDate: string;
  nextRentReview: string;
  paidTo: string;
  arrearsAmount: string;
  rentAmount: string;
  frequency: string;
  dueDay: string;
  bondAmount: string;
  bondSubmitted: string;
  leasePeriod: string;
  leasePeriodType: string;
  lastTrigger: string;
  lastTaskTrigger: string;
  rentStartDate: string;
  rentDescription: string;
  chargeNewTenancyFee: string;
  bondAccountId: string;
  source: string;
  originalLeaseStartDat: string;
  formatStartDate?: string;
  formatEndDate?: string;
  formatPaidTo?: string;
  rentedDate?: string;
  dayRemaining: number;
  progress?: number;
  formatLeaseStartDate?: string;
  rentedStartDate?: string;
  originalLeaseStartFormat?: string;
}

export const RMDisplayStatus = {
  [ECrmStatus.RM_CRM_PAST]: 'Past',
  [ECrmStatus.RM_CRM_CURRENT]: 'Current',
  [ECrmStatus.RM_CRM_FUTURE]: 'Future',
  [ECrmStatus.DELETED]: 'Deleted',
  [ECrmStatus.RM_CRM_LANDLORD]: 'Owner',
  [ECrmStatus.PROSPECT]: 'Owner prospect',
  [ECrmStatus.RM_CRM_LOST]: 'Lost',
  [ECrmStatus.RM_CRM_LOST_REJECTED]: 'Lost - rejected',
  [ECrmStatus.RM_CRM_TENANT]: 'Tenant'
};
