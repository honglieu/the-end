import { ITaskPreviewPayload } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ITaskPreview } from '@shared/types/task.interface';
import { createActionGroup, props } from '@ngrx/store';

export const taskPreviewApiActions = createActionGroup({
  source: 'Task Preview API',
  events: {
    'Get Task Preview Success': props<{
      taskPreview?: ITaskPreview;
      payload: ITaskPreviewPayload;
    }>(),
    'Get Task Preview Failure': props<{ error: unknown }>()
  }
});
