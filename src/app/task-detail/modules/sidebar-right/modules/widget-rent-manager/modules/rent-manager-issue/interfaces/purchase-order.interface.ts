import { ESyncStatus } from '@/app/task-detail/utils/functions';

export interface IPurchaseOrderSyncPayload {
  id: string;
  propertyId: string;
  issueDate: string;
  vendorId: string;
  externalId: number;
  purchaseOrderNumber: number | string;
  description: string;
  details: IJobDetail[];
  userId: string;
  userType: string;
  billingAddress: string;
  shippingAddress: string;
  isInvoiceRequired: boolean;
  workflowId: string;
  workOrderId: string;
  taskId: string;
  agencyId: string;
  currentStepId?: string;
  rmIssueId: string;
}

export interface IJobDetail {
  id?: string;
  externalId?: string;
  purchaseOrderId?: string;
  inventoryItemId: string;
  jobId: string;
  comment: string;
  quantity: number;
  cost: number;
  total: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPurchaseOrderSync extends IPurchaseOrderSyncPayload {
  errorMessSync: string;
  syncDate: string;
  syncStatus: ESyncStatus;
}

export interface IPurchaseOrderSyncRes {
  propertyId: string;
  issueDate: string;
  vendorId: string;
  description: string;
  syncStatus: ESyncStatus;
  syncDate: string;
  errorMessSync: string;
  details: IJobDetail[];
  workflowId: string;
  workOrderId: string;
  taskId: string;
  userId: string;
  userType: string;
  id: string;
}
