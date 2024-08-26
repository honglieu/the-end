import { TrudiButton, TrudiData } from '@shared/types/trudi.interface';
import { ETrudiType } from '@shared/enum/trudi';
import { Invoice } from '@shared/types/invoice.interface';
import { ITaskDetail, PhotoType } from '@shared/types/task.interface';
import {
  EInvoiceStatus,
  TenancyInvoiceSyncJob,
  Variable
} from '@shared/types/tenancy-invoicing.interface';
import { Setting } from '@shared/types/trudi.interface';
import { ETrudiRaiseByType } from '@shared/enum/trudi';

export interface IItemSelect {
  value: string;
  text: string;
}
export interface IPropertyTreeLeasingForm {
  tenancyName: string;
  tenancyContact: string;
  originalLeaseStart: string;
  leaseStart: string;
}

export interface ILeasingTaskDetail {
  description: string;
  smokeAlarmEventList: string[];
  smokeAlarmEvent: string;
  photos: PhotoType[];
}

export interface IListAccountPT {
  accountCode: string;
  accountGroup: string;
  accountGroupCode: string;
  agencyId: string;
  attractsSalesTax: boolean;
  category: string | boolean;
  createdAt: string;
  deleted: boolean;
  id: string;
  idPropertyTree: string;
  name: string;
  type: string;
  updatedAt: string;
  users: [];
}

export interface ILeasingResponse {
  type: ETrudiType;
  startConversationId: string;
  data: EntityData[] | TrudiData[];
  setting: Setting;
  title: string;
  raiseVia: ETrudiRaiseByType;
}

export interface ISendRelettingData {
  frequency: string;
  leaseDuration: string;
  leasePeriod: number;
  leasePeriodType: string;
  rentAmount: string;
}

export interface ISyncToPTFormData {
  taskId: string;
  doNotChargeNewTenancyFees: boolean;
  doChargeNewTenancyFees: boolean;
  tenancyName: string;
  tenantContacts: ITenantContacts[];
  rentAmount: number;
  paymentPeriod: string;
  originalLeaseStartDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  leasePeriodType: string;
  rentStartDate: string;
  nextRentReview: string;
  leasePeriod: string;
  rentDescription: string;
  securityDeposit?: {
    accountId: string;
    accountName: string;
    amount: number;
    amountLodgedDirect: number;
  };
  preferredContactMethod: IPreferredContactMethod;
}
export interface EntityData {
  step: number;
  invoiceStatus: EInvoiceStatus;
  isCompleted: boolean;
  body: Body;
  variable?: Variable;
  invoiceSyncJob: TenancyInvoiceSyncJob;
  invoices?: Invoice[];
  invoice?: Invoice[];
  taskDetail?: ITaskDetail;
  decisionIndex: number;
  syncJob: TenancyInvoiceSyncJob;
  reason: string;
}

export interface Body {
  text: string;
  button: TrudiButton[];
  variable: Variable;
  decisions: number;
}

export enum ELeasingButtonAction {
  sendWorkOrderToSupplier = 'send_work_order_to_sup',
  notifyTenantOfService = 'notify_tenants_of_service',
  notifyLandlordOfService = 'notify_landlord_of_service',
  sendInvoiceToPT = 'send_invoice_to_pt',
  sendLandlordComplianceCertificate = 'send_landlord_compliance_certificate',
  updateComplianceRegister = 'update_compliance_register_in_pt',
  requestStrataAttendToService = 'request_strata_attend_to_service',
  notifyTenantThatStrataAttending = 'notify_tenant_that_strata_attending'
}

export enum ContactMethod {
  HomePhone = 1,
  WorkPhone = 2,
  MobilePhone = 3,
  Fax = 4,
  Email = 5,
  Other = 6
}

export enum TenantContactsFieldValidation {
  email,
  phoneNumber
}

export interface ISyncPropertyTree {
  propertyId?: string;
  doNotChargeNewTenancyFees?: boolean;
  tenancyName?: string;
  tenantContacts?: ITenantContacts[];
  rentAmount?: number;
  paymentPeriod?: string;
  originalLeaseStartDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  leasePeriod?: string;
  leasePeriodType?: string;
  rentStartDate?: string;
  rentDescription?: string;
  nextRentReview?: string;
  securityDeposit?: ISecurityDeposit;
  preferredContactMethod?: IPreferredContactMethod;
}

export interface IPreferredContactMethod {
  preferredEmail: string;
  autoEmailReceipts: boolean;
  autoEmailInvoices: boolean;
  hasNotConsentedForElectronicNotices: boolean;
  doNotContractTenant: boolean;
}

export interface IContactInfos {
  contactMethod: number;
  details: string;
}

export interface IContact {
  givenName: string;
  familyName: string;
  address: {
    unit: string;
    streetNumber: string;
    addressLine1: string;
    addressLine2: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  contactInfos: IContactInfos[];
}

export interface ISecurityDeposit {
  accountId: string;
  accountName: string;
  amount: number;
  amountLodgedDirect: number;
}
export interface ITenantContacts {
  isPrimary: boolean;
  contact: IContact;
}

export interface IAddTenancyJob {
  data: IDataTenancyJob;
  syncStatus?: string;
}

export interface IDataTenancyJob {
  leasePeriod: string;
  leaseStartDate: string;
  leasePeriodType: string;
  leaseEndDate: string;
  rentAmount: string;
  paymentPeriod: string;
}
