import { createActionGroup, props } from '@ngrx/store';
import { IDBITaskGroup, IGetTasksPayload } from '@core/store/task-group/types';

export const taskGroupApiActions = createActionGroup({
  source: 'Task Groups API',
  events: {
    'Get Task Groups Success': props<{
      taskGroup?: Array<IDBITaskGroup>;
      payload?: IGetTasksPayload;
      isAllCompletedTaskFetched?: boolean;
      isCompletedGroupLoading?: boolean;
    }>(),
    'Get New Page Success': props<{
      taskGroup?: Array<IDBITaskGroup>;
      payload?: IGetTasksPayload;
      isAllCompletedTaskFetched?: boolean;
      isCompletedGroupLoading?: boolean;
    }>(),
    'Get Completed Task Groups Success': props<{
      taskGroup?: IDBITaskGroup;
      payload?: IGetTasksPayload;
      isAllCompletedTaskFetched?: boolean;
      isCompletedGroupLoading?: boolean;
    }>(),
    'Get Task Groups Failure': props<{ error: unknown }>()
  }
});
