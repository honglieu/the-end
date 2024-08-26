import { createActionGroup, props } from '@ngrx/store';
import { MessagesMailFolder } from '@core/store/message-mail-folder/types';
import {
  IEmailQueryParams,
  IMessagesResponse
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

export const messagesMailFolderApiActions = createActionGroup({
  source: 'Messages Mail Folder API',
  events: {
    'Get Messages Mail Folder Success': props<{
      messages?: Array<MessagesMailFolder>;
      currentPage?: number;
      res?: IMessagesResponse;
      payload?: IEmailQueryParams;
    }>(),
    'Get New Page Success': props<{
      messages?: Array<MessagesMailFolder>;
      currentPage?: number;
      payload?: IEmailQueryParams;
    }>(),
    'Get Messages Mail Folder Failure': props<{
      error: unknown;
      res?: IMessagesResponse;
    }>()
  }
});
