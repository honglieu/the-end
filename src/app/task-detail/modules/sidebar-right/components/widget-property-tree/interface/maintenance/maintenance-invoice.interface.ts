import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  EMaintenanceInvoiceAction,
  EMaintenanceInvoiceStatus
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/maintenance/maintenance-invoice.enum';

export interface IMaintenanceInvoice {
  id?: string;
  invoiceId?: string;
  status: EMaintenanceInvoiceStatus;
  data: {
    taskId?: string;
    agencyId?: string;
    invoice: {
      supplierId?: string;
      syncStatus?: ESyncStatus;
      creditorInvoice: {
        invoiceDescription?: string;
        dueDate?: string;
        gstAmount?: string;
        amount?: string;
        creditorReference?: string;
        accountId?: string;
        isSuccessful: boolean;
      };
      file: {
        fileName?: string;
        fileUrl?: string;
        extension?: string;
        isUploadFile: boolean;
        id?: string;
      };
    };
    maintenanceExternalId?: string;
    maintenanceId?: string;
  };
  ptData: {
    account_code?: string;
    integrator_operation_id?: string;
    creditor_reference?: string;
    invoice_description?: string;
    amount_excluding_gst?: string;
    due_date?: string;
    gst_amount?: string;
    creditor_external_id?: string;
    job_title?: string;
    job_description?: string;
  };
  supplier: {
    lastName?: string;
    firstName?: string;
  };
  ptError?: string;
  resultId?: string;
  maintenanceId?: string;
  supplierId?: string;
  creatorId?: string;
  isLatest: boolean;
  syncStatus?: ESyncStatus;
  action?: EMaintenanceInvoiceAction;
  createdAt?: string;
  updatedAt?: string;
  updateFromSocket?: boolean;
  stepId?: string;
}
export interface ICreditor {
  id: string;
  lastName: string;
  accountCode?: string;
}

export interface IInputSyncMaintenanceInvoice {
  taskId: string;
  agencyId?: string;
  propertyId: string;
  invoice: IInvoice;
}
export interface IInputUpdateSyncMaintenanceInvoice {
  agencyId?: string;
  taskId: string;
  invoice: IInvoice;
}
export interface IInvoice {
  supplierId?: string;
  syncStatus?: ESyncStatus;
  creditorInvoice?: {
    invoiceDescription?: string;
    dueDate?: Date | string;
    gstAmount?: string;
    amount?: string;
    creditorReference?: string;
    file?: {
      fileUrl?: string;
      fileName?: string;
      id?: string;
    };
  };
}
