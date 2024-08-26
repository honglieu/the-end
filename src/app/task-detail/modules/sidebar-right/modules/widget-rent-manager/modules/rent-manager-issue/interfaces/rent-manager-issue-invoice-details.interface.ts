import { EAccountType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

export interface IRMIssueInvoice {
  invoiceDetails: InvoiceDetail[];
  id: string;
  workOrderId: string;
  accountId: string;
  jobId: string | null;
  termId: string | null;
  comment: string;
  createdAt: string;
  invoiceDate: Date;
  dueDate: Date;
  balanceDue: number;
  subTotal: number;
  totalAmount: number;
  markupTotal: number;
  accountType: EAccountType;
  syncStatus: string;
  errorSync: string;
  syncDate: Date;
  isTaxable: boolean;
  tax: number;
  chargeAmountPaid: number;
  taxTypeId: string;
  taxPercent: number;
  source: {
    externalId: number;
    concurrencyId: number;
    sourceKey: string;
  };
  errorMessage: string;
  propertyId?: string;
  taskId?: string;
}

export interface InvoiceDetail {
  id: string;
  invoiceId: string;
  chargeTypeId: string;
  inventoryItemId: string;
  isTaxable: boolean;
  comment: string;
  unitCost: number;
  quantity: number;
  totalPrice: number;
  markup: number;
  createdAt: string;
  source: {
    concurrencyId: number;
    sourceKey: string;
    externalId: number;
  };
}

export interface InvoiceUser {
  firstName: string;
  lastName: string;
  id: string;
}

export type FormattedInvoiceDetail = Omit<
  InvoiceDetail,
  'source' | 'createdAt' | 'invoiceId'
>;

export type FormattedRmIssueInvoice = Omit<
  IRMIssueInvoice,
  | 'source'
  | 'createdAt'
  | 'errorSync'
  | 'syncDate'
  | 'syncStatus'
  | 'errorMessage'
  | 'taskId'
  | 'propertyId'
  | 'invoiceDetails'
> & {
  externalId: number;
  concurrencyId: number;
  invoiceDetails: FormattedInvoiceDetail[];
};
