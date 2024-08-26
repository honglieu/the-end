import { ESyncStatus } from '@/app/task-detail/utils/functions';

export interface PtNote {
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
  createdAt?: Date;
}

export interface BodySyncNote {
  taskId: string;
  description: string;
  propertyId: string;
  categoryId: string;
  agencyId: string;
  ptNoteEntityType: string;
  idUserPropertyGroup: string | null;
  ptId: string | null;
  stepId: string | null;
}

export interface BodyUpdateSyncNote {
  id: string;
  description: string;
  propertyId: string;
  categoryId: string;
  agencyId: string;
  ptNoteEntityType: string;
  stepId?: string;
  taskId: string;
}
