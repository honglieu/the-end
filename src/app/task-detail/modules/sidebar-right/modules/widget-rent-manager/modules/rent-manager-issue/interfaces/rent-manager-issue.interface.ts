import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  EBillType,
  ERentManagerHistoryCategoryType,
  ERentManagerIssueCheckListStatus
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { ERentManagerAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';

export interface IRentManagerIssue extends IRentManagerIssueGeneral {
  id?: string;
  action: string;
  syncState?: 'INIT' | 'UPDATE';
  syncStatus?: ESyncStatus;
  errorMessSync?: string;
  syncDate?: Date;
  details: IRentManagerIssueDetail;
  workOrder: IRentManagerIssueWorkOrder[];
  checklist: IRentManagerIssueCheckList[];
  historyNotes: IRentManagerIssueDetailHistoryNotes[];
}

export interface IRentManagerIssueGeneral {
  taskId: string;
  propertyId: string;
  agencyId: string;
  title: string;
  scheduleDate: string;
  dueDate: string;
  openDate: string;
  closeDate: string;
  statusId: string;
  syncStatus?: ESyncStatus;
  currentStepId?: string;
  currentStepAction?: ERentManagerAction;
}

export interface IRentManagerIssueDetail {
  tenantId: string;
  categoryId: string;
  priorityId: string;
  projectId: string;
  vendorId: string;
  jobId: string;
  description: string;
  resolution: string;
  externalId?: string;
  externalLinkedPropertyId?: string;
  externalLinkedUnitId?: string;
  externalLinkedTenantId?: string;
  externalLinkedProspectId?: string;
  tenantDetail?: ITenantDetail;
  createdAt?: Date;
}

export interface IRentManagerIssueWorkOrder {
  id?: string;
  inventoryItemId: string;
  vendorId: string;
  jobId: string;
  description: string;
  quantity: number;
  cost: number;
  salePrice: number;
  totalPrice: number;
  externalId?: string;
  bills: Array<IBill>;
  createdAt?: Date;
}

export interface IBill {
  id?: string;
  type: EBillType;
  syncStatus: string;
  syncDate: Date;
}

export interface IRentManagerIssueCheckList {
  id: string;
  externalId?: string;
  description: string;
  concurrencyId?: number;
  status: ERentManagerIssueCheckListStatus;
  updatedAt: string;
  createdAt: string;
}

export interface IRentManagerIssueDetailHistoryNotes {
  id?: string;
  categoryId: string;
  note: string;
  files: IHistoryNoteFile[];
  externalId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface IHistoryNoteFile {
  fileName?: string;
  mediaLink?: string;
  fileType?: string;
  fileSize?: string;
  icon?: string;
  fileId?: string;
  historyAttachmentId?: string;
  historyId?: string;
}

export interface IRentManagerHistoryCategories {
  id: string;
  name: string;
  types: ERentManagerHistoryCategoryType[];
}

export interface IGlAccount {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  sortOrder: number;
}

export interface ITerm {
  id: string;
  isActive: boolean;
  monthDay: number;
  name: string;
  netDays: number;
  netMonths: number;
}

export interface IRmIssueData {
  status: IRentManagerIssueStatus[];
  priority: IRmIssuePriority[];
  category: IRmIssueCategory[];
  job: IRmIssueJob[];
  inventoryItem: IInventoryItemIssue[];
  project: IRmIssueProject[];
  purchaseOrderWorkflow: IPurchaseOrderWorkflowItem[];
  glAccount: IGlAccount[];
  terms: ITerm[];
  historyNoteCategories: IRentManagerHistoryCategories[];
  chargeTypes: IRentManagerIssueChargeType[];
  taxTypes: IRentManagerIssueTaxType[];
}

export interface IPurchaseOrderWorkflowItem {
  id: string;
  name: string;
}

export interface IRmIssuePriority {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface IRmIssueCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface IRmIssueJob {
  id: string;
  name: string;
  description: string;
  startDate: string;
  isActive: boolean;
}

export interface IRmIssueProject {
  id: string;
  name: string;
  comments: string;
  categoryId: string;
  statusId: string;
  priorityId: string;
  jobId: string;
  startDate: string;
}

export interface IRmIssueTenants {
  id?: string; // receiver id
  conversationId?: string;
  isPrimary?: boolean;
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  iviteSent?: string | null;
  lastActivity?: string | null;
  phoneNumber?: string | null;
  email?: string;
  offBoardedDate?: string | null;
  contactType?: string;
  streetLine?: string;
  isAppUser?: boolean;
  landingPage?: string;
  idUserPropertyGroup?: string;
  mobileNumber?: string | null;
  disabled?: boolean;
  propertyId?: string;
}

export interface ListUserResponse {
  currentPage?: number;
  totalPage?: number;
  users?: IRmIssueTenants[];
}

export interface IRentManagerIssueStatus {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface IInventoryItemIssue {
  id: string;
  name: string;
  description: string;
  cost: number;
  markup: number;
  quantity: number;
  chargeTypeId: string;
}

export interface IJobIssue {
  id: string;
  name: string;
  description: string;
  startDate: string;
  isActive: boolean;
}

export interface IUsersSupplierBasicInfoProperty {
  suppliers: ISupplierBasicInfo[];
  totalPages: number;
  currentPage: number;
}

export interface ISupplierBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isFavourite?: boolean;
}

export interface ISyncStatus {
  status: ESyncStatus;
  lastTimeSync: Date;
}

export interface IRentManagerIssueChargeType {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
}

export interface ITenantDetail {
  user: {
    source: {
      externalId: string;
    };
  };
}

export interface IRentManagerIssueTaxType {
  id: string;
  chargeTypeId: string;
  name: string;
  rate: number;
}

export interface IRentManagerIssueSyncStatus {
  syncStatus: ESyncStatus;
  syncDate: Date;
}
