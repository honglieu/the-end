import { ETrudiType } from '@shared/enum/trudi';
import {
  CreditorInvoiceButton,
  CreditorInvoiceSetting
} from '@shared/types/creditor-invoicing.interface';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ITaskDetail } from './task.interface';
import { TaskDetailPet } from './trudi.interface';
import { IPropertyNoteForm } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { IDocumentFiles } from './invoice.interface';
import { MaintenanceDecision } from './trudi.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
export interface ITenancyInvoiceResponse {
  type: ETrudiType;
  startConversationId: string;
  data: EntityData[];
  setting: CreditorInvoiceSetting;
  title: string;
}

export interface EntityData {
  step: number;
  invoiceStatus: EInvoiceStatus;
  decisionStatus: EInvoiceStatus;
  isCompleted: boolean;
  body: TenancyInvoiceBody;
  variable?: Variable;
  syncJob: TenancyInvoiceSyncJob;
  invoice?: TenancyInvoicing[];
  taskDetail?: ITaskDetail | TaskDetailPet;
}

export interface TenancyInvoiceBody {
  text: string;
  button: TenancyInvoiceButtonGroup;
  decisions?: buttonDecison[];
}

export interface buttonDecison {
  button: Buttons[];
}

export interface Buttons {
  isCompleted: boolean;
  index: number;
  type: string;
  text: string;
  textForward?: string;
  status: string;
  action: string;
}

export interface TenancyInvoiceButtonGroup {
  [key: string]: CreditorInvoiceButton[];
}

export interface TenancyInvoiceRequestButton {
  index: number;
  type: string;
  text: string;
  textForward?: string;
  status: string;
  action: string;
}

export interface TenancyInvoiceSyncJob {
  invoices: TenancyInvoicing[];
  syncStatus: SyncMaintenanceType;
  syncDate: string;
  errorMessSync: string;
  data?: IPropertyNoteForm;
  status?: SyncMaintenanceType;
  lastTimeSync?: string;
  decisions?: MaintenanceDecision[];
}

export interface TenancyInvoicing {
  supplierId: string;
  firstTimeSyncSuccess: boolean;
  isCreditorInvoice: boolean;
  isLinkInvoice: boolean;
  syncStatus: SyncMaintenanceType;
  creditorInvoice: CreditorInvoice;
  tenancyInvoice: TenancyInvoice;
  pdfName: string;
  pdfUrl: string;
  id: string;
  dueDate?: string;
  gstAmount?: string;
  totalAmount?: string;
  file?: any;
  user: {
    firstName: string;
    lastName: string;
    id?: string;
    type: EUserPropertyType;
  };
  created: string;
  filePrefill?: IDocumentFiles;
  isTicket?: boolean;
  isInvoice?: boolean;
}

export interface CreditorInvoice {
  description: string;
  dueDate: string;
  salesTax: number;
  amount: number;
  creditorReference: string;
  invoiceId?: string;
  status?: string | any;
  maintenanceInvoiceId?: string;
}

export interface TenancyInvoice {
  id?: string;
  tenancyId: string;
  description: string;
  dueDate: string;
  salesTax: number;
  amount: number;
  creditorReference: string;
  invoiceId?: string;
  status?: string;
}

export interface Variable {
  receivers: Receivers[];
}

export interface Receivers {
  id: string;
  firstName?: string;
  lastName?: string;
  userPropertyType?: EUserPropertyType;
  conversationId?: string;
  action?: CreditorInvoicingButtonAction;
  raiseBy?: string;
  tenantId?: string;
}

export interface ScheduleSendMessage {
  sendFrom: string;
  reminderTimes: string[] | Date[];
  taskId?: string;
  receivers?: string[];
  receiverIds: string[];
  conversationTitle: string;
  message: any;
}

export enum EInvoiceStatus {
  CANCELLED = 'CANCELLED',
  DEFAULT = 'DEFAULT',
  PAID = 'PAID',
  PARTPAID = 'PARTPAID',
  UNPAID = 'UNPAID',
  REPLACED = 'REPLACED'
}

export const SendMessageTenancyInvoicingStatus = {
  [EInvoiceStatus.PARTPAID]: 'part-paid',
  [EInvoiceStatus.CANCELLED]: 'cancelled',
  [EInvoiceStatus.UNPAID]: 'unpaid',
  [EInvoiceStatus.PAID]: 'paid',
  [EInvoiceStatus.DEFAULT]: 'default'
};

export interface InvoiceForm {
  creditorInvoice?: {
    gstAmount?: number;
    excludingGST?: number;
    includingGST?: number;
    dueDate?: string;
    invoiceREF?: string;
    invoiceDescription?: string;
    creditor?: string;
    accountId?: string;
  };
  tenancyInvoice?: {
    gstAmount?: number;
    excludingGST?: number;
    includingGST?: number;
    account?: string;
    dueDate?: string;
    invoiceREF?: string;
    invoiceDescription?: string;
    tenancy?: string;
    description?: string;
    amount?: string;
    salesTax?: string;
  };
  invoiceType?: string;
  invoiceDocument?: string;
  supplierId?: string;
}

export interface ICreditorInvoiceOption {
  id: string;
  label: string;
}

export interface ITenancyInvoice {
  accountId: string;
  amount: number | string;
  creditorReference: string;
  description: string;
  dueDate: Date | string;
  id: string | null;
  salesTax: number | string;
  tenancyId: string;
  sendEmailTenancyInvoice?: boolean;
  status?: EInvoiceStatus;
  syncStatus?: ESyncStatus;
  syncDate?: Date;
  ptId?: string;
}

export interface ICreditorInvoice {
  gstAmount?: number;
  excludingGST?: number;
  includingGST?: number;
  amount?: number;
  dueDate?: string;
  description?: string;
  creditor?: string;
  status?: EInvoiceStatus;
  id?: string | null;
  salesTax?: number;
  creditorReference?: string;
  syncStatus?: ESyncStatus;
  syncDate?: Date;
  ptId?: string;
  accountId?: string;
}

export interface InvoiceDataReq {
  invoiceWidgetType?: EInvoiceTypeBS;
  syncDate?: string;
  creditorInvoice?: ICreditorInvoice;
  id?: string;
  invoiceDocument?: IDocumentFile;
  isCreditorInvoice?: boolean;
  isLinkInvoice?: boolean;
  supplierId?: string;
  supplier?: any;
  syncStatus?: ESyncStatus;
  creditorReference?: string;
  tenancyInvoice?: ITenancyInvoice;
  invoiceTaskType?: string;
  createdAt?: Date;
  deletedAt?: string;
  updatedAt?: string;
  users?: string;
  firstTimeSyncSuccess?: boolean;
  stepId?: string;
}

export interface IDocumentFile {
  name: string;
  url: string;
  isUpload?: boolean;
}

export enum EInvoiceTypeBS {
  TENANCY = 'TENANCY_INVOICE',
  CREDITOR = 'CREDITOR_INVOICE'
}
