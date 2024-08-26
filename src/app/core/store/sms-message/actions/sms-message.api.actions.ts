import { createActionGroup, props } from '@ngrx/store';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { Message } from '@core/store/message/types';

export const smsMessageApiActions = createActionGroup({
  // TODO UPDATE TYPE OF MESSAGE
  source: 'Sms Messages API',
  events: {
    'Get Sms Message Success': props<{
      messages?: Array<Message>;
      total?: number;
      currentPage?: number;
      payload?: IMessageQueryParams;
    }>(),
    'Get New Page Success': props<{
      messages?: Array<Message>;
      total?: number;
      currentPage?: number;
      payload?: IMessageQueryParams;
    }>(),
    'Get Sms Message Failure': props<{ error: unknown }>()
  }
});
