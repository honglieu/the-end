import { IOptionPill } from '@shared/components/dropdown-pill/dropdown-pill';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  EChargeType,
  ELeaseTerm,
  IUserField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';

export enum TenantFormName {
  Id = 'id',
  Info = 'info',
  Address = 'address',
  Name = 'name',
  Lease = 'lease',
  Contact = 'contacts',
  Deposit = 'deposit',
  Setting = 'setting',
  Charges = 'charges',
  Recurring = 'recurring',
  OneTime = 'oneTime',
  UserFields = 'userFields'
}

export interface ITenantOptions {
  rmApplicantTypes: IOptionPill[];
  contactTypes: IOptionPill[];
  securityDepositTypes: IOptionPill[];
  taxTypes: IOptionPill[];
  subsidies: IOptionPill[];
  leaseTerms: ELeaseTerm[];
  chargeTypes: EChargeType[];
  tenantAddressTypes: IOptionPill[];
  userDefinedFields: IUserField[];
  glStartDate?: string;
}

export interface IAddresses {
  addressId: number;
  addressTypeId: number;
  city: string;
  isPrimary: boolean;
  parentId: number;
  parentType: string;
  postalCode: string;
  state: string;
  street: string;
}

export interface IContacts {
  annualIncome: number;
  applicantType: string;
  comment: string;
  contactId: number;
  contactTypeId: number;
  createDate: string;
  createUserId: number;
  email: string;
  employer: string;
  federalTaxId: string;
  firstName: string;
  imageId: number;
  isPrimary: boolean;
  isActive: boolean;
  lastName: string;
  license: string;
  middleName: string;
  parentId: number;
  parentType: string;
  updateDate: string;
  updateUserId: number;
  vehicle: string;
}
export interface ITenantData {
  addresses: IAddresses[];
  charges;
  checkPayeeName: string;
  comment: string;
  contacts: IContacts[];
  createDate: string;
  createUserId: number;
  firstName: string;
  lastName: string;
  lastNameFirstName: string;
  lease: string;
  name: string;
  propertyId: number;
  recurringCharges: string;
  rentDueDay: number;
  rentPeriod: string;
  source: string;
  status: string;
  subsidyTenants: string;
  tenantDisplayId: number;
  tenantId: number;
  updateDate: string;
  updateUserId: number;
}

export interface ITenantDataRes {
  createdAt: string;
  data: ITenantData;
  deletedAt: string;
  errorMessSync: string;
  id: string;
  idUserPropertyGroup: string;
  propertyId: string;
  syncDate: string;
  syncStatus: ESyncStatus;
  taskId: string;
  updatedAt: string;
}

export enum ETooltipNewTenantText {
  TITLE_TOOLTIP_DELETED = 'Item can only be deleted directly from Rent Manager',
  TITLE_TOOLTIP_BUTTON_ADD_NOT_SYNC = 'To add a charge, please sync new tenant to RM first',
  TITLE_TOOLTIP_REMOVED = 'Item can only be removed directly from Rent Manager'
}
