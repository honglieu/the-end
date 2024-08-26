import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ERentManagerAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ERentManagerNotesType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { IHistoryNoteFile } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';

export interface IRMNoteInfo {
  id: string;
  categoryName?: string;
  entityType?: string;
  description?: string;
  nameUserPropertyGroup?: string;
  idUserPropertyGroup?: string;
  syncStatus?: ESyncStatus;
  categoryId?: string;
  ptId?: string;
  lastModified?: string;
  firstTimeSyncSuccess?: boolean;
  ptNoteEntityType?: string;
  stepId?: string;
}
export interface IRentManagerNote extends IRentManagerNoteGeneral {
  categoryId: string;
  categoryName: string;
  createdAt: string;
  description: string;
  entityId: string;
  entityType: string;
  entityTypeName?: string;
  entityName?: string;
  file: IHistoryNoteFile[];
  id: string;
  lastModified: null | string;
  nameUserPropertyGroup: null | string;
  syncState?: 'INIT' | 'UPDATE';
  syncStatus?: ESyncStatus;
  errorMessSync?: string;
  updatedAt: string;
  stepId?: string;
  error?: string;
  externalId?: string;
}
export interface IRentManagerNoteGeneral {
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

export interface ISelectCreateNoteByType {
  createNoteType: ERentManagerNotesType;
  existNote: IRentManagerNote;
}

export interface IInputToGetListExistingNote {
  taskId: string;
  propertyId: string;
  tenantIds: Array<string>;
  ownerIds: Array<string>;
}
