import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EntityState } from '@ngrx/entity';

export interface TaskFolder extends ITaskFolder {}

export interface TaskFolderReducerState extends EntityState<TaskFolder> {
  fetching: boolean;
  error: unknown;
  payload: Partial<TaskFolderPayloadType>;
}

export type TaskFolderPayloadType = {
  companyId: string;
};
