import {
  IGetTaskByFolder,
  IGetTaskByFolderPayload,
  IGetTasksByGroupPayload
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EntityState } from '@ngrx/entity';

export interface IDBITaskGroup extends IGetTaskByFolder {
  taskFolderId?: string;
  id?: string;
  payloadCompleted?: IGetTaskByFolderPayload;
  payloadProcess?: IGetTaskByFolderPayload;
}
export interface IDBITaskRow extends ITaskRow {
  taskFolderId?: string;
}

export interface IGetTasksPayload {
  payloadCompleted?: IGetTasksByGroupPayload;
  payloadProcess?: IGetTaskByFolderPayload;
}

export interface TaskGroupReducerState extends EntityState<IDBITaskGroup> {
  isFromCache: boolean;
  fetching: boolean;
  total: number;
  error: unknown;
  payload: Partial<IGetTasksPayload>;
}
