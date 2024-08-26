import { UserConversation } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const voiceMailDetailApiActions = createActionGroup({
  source: 'Voice Mail Detail API',
  events: {
    'Set Current Voice Mail': props<{
      taskId: string;
      conversationId: string;
    }>(),
    'Update Voicemail Messages': props<{
      messages: IMessage[];
    }>(),
    'Update Voicemail Task': props<{ task: TaskItem }>(),
    'Get Detail Success': props<{
      task: TaskItem;
      messages?: IMessage[];
    }>(),
    'Get Cache Detail Success': props<{
      task: TaskItem;
      messages?: IMessage[];
    }>(),
    'Get Cache Task Detail Success': props<{ task: TaskItem }>(),
    'Get Cache Messages Success': props<{
      messages: IMessage[];
    }>(),
    'Get Task Failure': props<{ error: unknown }>(),
    'Exit Task Detail': emptyProps()
  }
});
