import { createActionGroup, props } from '@ngrx/store';
import { Message } from '@core/store/message/types';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';

export const messageApiActions = createActionGroup({
  source: 'Messages API',
  events: {
    'Get Message Success': props<{
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
    'Get Message Failure': props<{ error: boolean }>()
  }
});
