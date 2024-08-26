import { TenancyInvoice } from './tenancy-invoicing.interface';

export interface MaintenanceJobResponse {
  title: string;
  syncStatus: string;
  raiseOn: string;
  raiseBy: RaiseBy;
  status: string;
  description: string;
  lastTimeSync?: string;
  photos: Photo[];
  supplier: string;
  invoices: TenancyInvoice[];
  errorMessSync?: string;
}

export interface Photo {
  mediaLink: string;
}

export interface RaiseBy {
  name: string;
  type: string;
}

export interface SyncResponse {
  type: string;
  syncStatus: string;
  status: string;
  conversationId: string;
  taskId: string;
  lastTimeSync: string;
}

export interface PayloadActionUpdateBtn {
  isCompleted: boolean;
  status: string;
}
