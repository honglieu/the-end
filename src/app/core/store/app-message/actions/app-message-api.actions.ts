import { createActionGroup, props } from '@ngrx/store';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { Message } from '@core/store/message/types';

export const appMessageApiActions = createActionGroup({
  source: 'App Messages API',
  events: {
    'Get App Message Success': props<{
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
    'Get App Message Failure': props<{ error: boolean }>()
  }
});
