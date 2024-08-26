import { ITaskPreviewPayload } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ITaskPreview } from '@shared/types/task.interface';
import { createActionGroup, props } from '@ngrx/store';

export const taskPreviewActions = createActionGroup({
  source: 'Task Preview Panel',
  events: {
    'Payload Change': props<{ payload: ITaskPreviewPayload }>(),
    'Get Cache Success': props<{ taskPreview: ITaskPreview }>(),
    'Set Task Preview': props<{ taskPreview: ITaskPreview }>()
  }
});
