import {
  MaintenanceDecision,
  TrudiButton,
  TrudiData
} from '@shared/types/trudi.interface';
import { ETrudiType } from '@shared/enum/trudi';
import { Invoice } from '@shared/types/invoice.interface';
import { ITaskDetail, PhotoType } from '@shared/types/task.interface';
import {
  EInvoiceStatus,
  Receivers,
  TenancyInvoiceSyncJob,
  Variable
} from '@shared/types/tenancy-invoicing.interface';
import { Setting } from '@shared/types/trudi.interface';
import { ETrudiRaiseByType } from '@shared/enum/trudi';
import { Suppliers } from '@shared/types/agency.interface';

export interface ISmokeAlarmTaskDetail {
  description: string;
  smokeAlarmEventList: string[];
  smokeAlarmEvent: string;
  photos: PhotoType[];
}

export interface SmokeAlarmOption {
  decisionList: MaintenanceDecision[];
  reasons: Reason[];
  contact: Suppliers;
  reasonIndex: number;
  decisionIndex: number;
  isConfirmDecision?: boolean;
}

export enum TYPESUPPLIER {
  SUPPLIER = 'Supplier',
  STRATA = 'Strata',
  LANDLORD = 'Landlord'
}
export interface Reason {
  index: number;
  title: string;
  reason: string;
}

export interface ISmokeAlarmInvoiceResponse {
  type: ETrudiType;
  startConversationId: string;
  data: EntityData[] | TrudiData[];
  setting: Setting;
  title: string;
  raiseVia: ETrudiRaiseByType;
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

export enum ESmokeAlarmButtonAction {
  sendWorkOrderToSupplier = 'send_work_order_to_sup',
  notifyTenantOfService = 'notify_tenant_of_service',
  notifyLandlordOfService = 'notify_landlord_of_service',
  sendInvoiceToPT = 'send_invoice_to_pt',
  sendLandlordComplianceCertificate = 'send_landlord_compliance_certificate',
  updateComplianceRegister = 'update_compliance_register_in_pt',
  requestLandlordCompleteJob = 'request_landlord_complete_job',
  notifyTenantThatLandlordAttending = 'notify_tenant_that_landlord_attending',
  requestStrataAttendToService = 'request_strata_attend_to_service',
  notifyTenantThatStrataAttending = 'notify_tenant_that_strata_attending',
  createOrLinkComplianceItem = 'create_or_link_compliance_item'
}

export enum DecisionAttending {
  SupplierAttending = 'Supplier attending',
  LandlordAttending = 'Landlord attending',
  StrataAttending = 'Strata attending'
}

export enum EDecisionIndex {
  SUPPLIER,
  LANDLORD,
  STRATA
}

export enum EManagedBy {
  AGENT = 'Agent',
  OWNER = 'Owner',
  STRATA = 'Strata'
}

export enum ESmokeAlarmTypeInReceiver {
  tenant = 'tenant',
  conversation = 'conversation'
}

export enum InvoiceFormState {
  SelectInvoiceType,
  SelectInvoiceDocument,
  CreateCreditorInvoice,
  CreateTenantInvoice
}

export enum InvoiceType {
  CreditorInvoice = 'CreditorInvoice',
  TenancyInvoice = 'TenancyInvoice'
}

export const INVOICE_TYPE_OPTIONS = [
  {
    value: InvoiceType.CreditorInvoice,
    label: 'Creditor invoice'
  },
  {
    value: InvoiceType.TenancyInvoice,
    label: 'Tenancy invoice'
  }
];

export interface IPropertyNoteForm {
  managedBy?: string;
  creditorId?: string;
  authorityForm?: string;
  expiryDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
  smokeAlarmType?: string;
  complianceItem?: string;
  vacateDate?: string;
  previousVacateDate?: string;
  note?: string;
  authorRecevied?: string;
  expiredDate?: string;
  complianceCategoryId?: string;
  id?: string;
  servicesBy?: string;
  syncStatus?: string;
  statusOutGoingInspection?: string;
  complianceCategory?: {};
  complianceSyncFail?: {};
  status?: string;
  complianceTaskId?: string;
}

export interface IDataFormSupplier {
  creditorId?: string;
  authorityForm?: string;
}

export type SmokeAlarmButton = Omit<TrudiButton, 'action'> & {
  action?: ESmokeAlarmButtonAction;
};

export type SmokeAlarmReceivers = Omit<Receivers, 'action'> & {
  action?: ESmokeAlarmButtonAction;
};
