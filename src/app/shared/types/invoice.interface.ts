import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { TenancyInvoice, CreditorInvoice } from './tenancy-invoicing.interface';

export interface Invoice {
  id?: string;
  syncStatus?: string;
  creditor: string;
  jobTitle: string;
  invoiceDescription: string;
  totalAmount: string;
  gstAmount: string;
  dueDate: string;
  pdfName: string;
  pdfUrl: string;
  file?: any;
}

export interface IInvoice {
  supplierId: string;
  isCreditorInvoice: boolean;
  isLinkInvoice?: boolean;
  syncStatus: string;
  creditorInvoice: ICreatorInvoice;
  maintenanceInvoiceId?: string;
  tenancyInvoice?: TenancyInvoice;
  file: any;
  filePrefill?: IDocumentFiles;
  id: string;
  isUploadFile?: boolean;
  supplierName?: string;
  tenancyName?: string;
  status?: string;
  syncDate?: string;
  invoiceDocument?: IInvoiceDocument;
}

export interface IInvoiceDocument {
  name: string;
  url: string;
  isUpload?: boolean;
}

export interface IUserInvoice {
  iviteSent: string;
  lastActivity: any;
  offBoardedDate: any;
  email: string;
  firstName: string;
  lastName: string;
  id: string;
  googleAvatar: any;
  type: string;
}

export interface IDocumentFiles {
  name: string;
  url: string;
  id: string;
  userInvoice?: IUserInvoice;
}

export interface ICreatorInvoice {
  description: string;
  dueDate: string;
  invoiceId: string;
  salesTax: string;
  amount: string;
  status: string;
  creditorReference: string;
  syncStatus?: string;
  gstAmount?: string;
  invoiceDescription?: string;
  maintenanceInvoiceId?: string;
  id?: string;
}

export interface IMapCreditor {
  id: string;
  supplierId: string;
  isCreditorInvoice: boolean;
  isLinkInvoice: boolean;
  syncStatus: string | ESyncStatus;
  creditorInvoice: CreditorInvoice;
  file?: InvoiceFile;
  filePrefill?: IDocumentFiles;
  supplierName?: string;
}

export interface InvoiceFile {
  name: string;
  url: string;
}

export interface IMapTenant {
  supplierId: string;
  isCreditorInvoice: boolean;
  isLinkInvoice: boolean;
  syncStatus: string;
  tenancyInvoice: TenancyInvoice;
  id?: string;
  file?: InvoiceFile;
  filePrefill?: IDocumentFiles;
  firstTimeSyncSuccess?: boolean;
  creditorInvoice?: CreditorInvoice;
}

export interface IInvoicesTrudiResponse {
  data: IDataTrudiResponse;
  setting: {};
  startConversationId: string;
  title: string;
  type: string;
}

export interface IDataTrudiResponse {
  body: IBodyData;
  invoice: Invoice;
  syncJob: ISyncJob;
  variable: {};
}

export interface ISyncJob {
  errorMessSync: string;
  invoices: [];
  syncDate: string;
  syncStatus: string;
}

export interface IBodyData {
  button: [];
  text?: string;
}

export interface IInvoiceStatus {
  UNPAID: string;
  PARTPAID: string;
  PAID: string;
  CANCELLED?: string;
  COMPLETED?: string;
  CANCEL?: string;
}
