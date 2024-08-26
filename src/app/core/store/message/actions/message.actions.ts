import { createActionGroup, props } from '@ngrx/store';
import { Message } from '@core/store/message/types';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';

export const messageActions = createActionGroup({
  source: 'Messages',
  events: {
    'Set All': props<{ messages: Message[] }>(),
    'Get Cache Success': props<{ messages: Message[] }>(),
    'Remove Message': props<{
      conversationId: string;
      tokenProperty: Partial<IMessageQueryParams>;
    }>()
  }
});
