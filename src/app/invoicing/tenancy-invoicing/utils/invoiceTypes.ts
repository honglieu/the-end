import { EUserPropertyType } from '@shared/enum/user.enum';
import { EAvailableFileIcon } from '@shared/types/file.interface';

export interface PropertyTreeAccount {
  agencyId: string;
  id: string;
  idPropertyTree: string;
  name: string;
  users: CreditorUser[];
}

export interface CreditorUser {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  type: EUserPropertyType;
}

export interface IDocuments {
  pdfName: string;
  pdfUrl: string;
  id: string;
  dueDate: string;
  gstAmount: string;
  totalAmount: string;
  icon: EAvailableFileIcon | string;
  subTitle: string;
  created: string;
  supplierId?: string;
  isUpLoad?: boolean;
  size?: string;
  fileType?: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
  isInvoice?: boolean;
  checked?: boolean;
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
