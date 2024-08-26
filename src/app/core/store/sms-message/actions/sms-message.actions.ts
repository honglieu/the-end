import { createActionGroup, props } from '@ngrx/store';
import { Message } from '@core/store/message/types';

export const smsMessageActions = createActionGroup({
  // TODO UPDATE TYPE OF MESSAGE
  source: 'Sms Messages',
  events: {
    'Set All': props<{ messages: Message[] }>(),
    'Get Cache Success': props<{ messages: Message[] }>(),
    'Set Temp Message': props<Message>(),
    'Remove Temp Message': props<{ conversationId?: string }>(),
    'Set Loading Message': props<Message>(),
    'Remove Loading Message': props<{ conversationId?: string }>()
  }
});
