import { TaskItem } from '@shared/types/task.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export const facebookDetailApiActions = createActionGroup({
  source: 'Facebook Detail API',
  events: {
    'Set Current Facebook Detail': props<{
      taskId: string;
      conversationId: string;
    }>(),
    'Get Detail Success': props<{
      task: TaskItem;
      messages?: IFacebookMessage[];
    }>(),
    'Update Facebook Messages': props<{
      messages: IFacebookMessage[];
    }>(),
    'Update Facebook Task': props<{ task: TaskItem }>(),
    'Get Cache Detail Success': props<{
      task: TaskItem;
      messages?: IFacebookMessage[];
    }>(),
    'Get Cache Task Detail Success': props<{ task: TaskItem }>(),
    'Get Cache Messages Success': props<{
      messages: IFacebookMessage[];
    }>(),
    'Get Task Failure': props<{ error: unknown }>(),
    'Exit Task Detail': emptyProps()
  }
});
