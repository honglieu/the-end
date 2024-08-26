import { createActionGroup, props } from '@ngrx/store';
import { TaskFolder } from '@core/store/taskFolder/types';

export const taskFolderActions = createActionGroup({
  source: 'Task Folder Page',
  events: {
    'Set All': props<{ taskFolders: TaskFolder[] }>(),
    'Get Cache Success': props<{ taskFolders: TaskFolder[] }>()
  }
});
