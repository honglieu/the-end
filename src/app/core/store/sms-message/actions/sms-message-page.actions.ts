import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const smsMessagePageActions = createActionGroup({
  // TODO UPDATE TYPE OF MESSAGE
  source: 'Sms Messages Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IMessageQueryParams }>()
  }
});
