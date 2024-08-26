import {
  IGetTaskByFolderPayload,
  IGetTasksByGroupPayload
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const taskGroupPageActions = createActionGroup({
  source: 'Task Groups Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': props<{
      page?: number;
    }>(),
    'Sort Completed Task Change': props<{
      sortTaskType?: string;
    }>(),
    'Payload Change': props<{
      payloadProcess: IGetTaskByFolderPayload;
      payloadCompleted: IGetTasksByGroupPayload;
    }>()
  }
});
