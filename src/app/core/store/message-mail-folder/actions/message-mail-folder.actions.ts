import { createActionGroup, props } from '@ngrx/store';
import { MessagesMailFolder } from '@core/store/message-mail-folder/types';
import {
  EmailItem,
  IEmailQueryParams,
  IMessagesResponse
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

export const messagesMailFolderActions = createActionGroup({
  source: 'Messages Mail Folder',
  events: {
    'Set All': props<{ messages: EmailItem[] }>(),
    'Get Cache Success': props<{
      messages?: Array<MessagesMailFolder>;
      total?: number;
      currentPage?: number;
      res?: IMessagesResponse;
      payload?: IEmailQueryParams;
    }>()
  }
});
