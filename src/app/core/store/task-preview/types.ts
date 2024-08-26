import { ITaskPreviewPayload } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ITaskPreview } from '@shared/types/task.interface';

export interface TaskPreviewReducerState {
  taskPreview: ITaskPreview;
  payload: ITaskPreviewPayload;
  fetching: boolean;
  error: unknown;
}
