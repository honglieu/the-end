import { TaskItem } from '@shared/types/task.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

export const whatsappDetailApiActions = createActionGroup({
  source: 'Whatsapp Detail API',
  events: {
    'Set Current Whatsapp Detail': props<{
      taskId: string;
      conversationId: string;
    }>(),
    'Get Detail Success': props<{
      task: TaskItem;
      messages?: IWhatsappMessage[];
    }>(),
    'Update Whatsapp Messages': props<{
      messages: IWhatsappMessage[];
    }>(),
    'Update Whatsapp Task': props<{ task: TaskItem }>(),
    'Get Cache Detail Success': props<{
      task: TaskItem;
      messages?: IWhatsappMessage[];
    }>(),
    'Get Cache Task Detail Success': props<{ task: TaskItem }>(),
    'Get Cache Messages Success': props<{
      messages: IWhatsappMessage[];
    }>(),
    'Get Task Failure': props<{ error: unknown }>(),
    'Exit Task Detail': emptyProps()
  }
});
