import { createActionGroup, props } from '@ngrx/store';
import { TaskFolderPayloadType } from '@core/store/taskFolder/types';

export const taskFolderPageActions = createActionGroup({
  source: 'TaskFolder Page',
  events: {
    'Payload Change': props<{ payload: TaskFolderPayloadType }>()
  }
});
