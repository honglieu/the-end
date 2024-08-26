import { createActionGroup, props } from '@ngrx/store';
import {
  TaskFolder,
  TaskFolderPayloadType
} from '@core/store/taskFolder/types';

export const taskFolderApiActions = createActionGroup({
  source: 'Folder API',
  events: {
    'Get Task Folder Success': props<{
      taskFolders?: Array<TaskFolder>;
      payload?: TaskFolderPayloadType;
    }>(),
    'Get Task Folder Failure': props<{ error: unknown }>()
  }
});
