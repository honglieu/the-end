import { createActionGroup, props } from '@ngrx/store';
import { IDBITaskGroup } from '@core/store/task-group/types';
import { IGetTaskByFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

export const taskGroupActions = createActionGroup({
  source: 'Task Groups Page',
  events: {
    'Set All': props<{ taskGroups: IDBITaskGroup[] }>(),
    'Set Task Group': props<{ taskGroups: IGetTaskByFolder[] }>(),
    'Update Task Group': props<{
      taskGroup: IGetTaskByFolder;
      taskGroupId: string;
    }>(),
    'Update Task': props<{ task: ITaskRow }>(),
    'Set Task List': props<{ taskList: ITaskRow[]; groupId: string }>(),
    'Get Cache Task Group': props<{ taskGroups: IDBITaskGroup[] }>()
  }
});
