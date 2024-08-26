import { createActionGroup, props } from '@ngrx/store';
import { MailFolderPayloadType } from '@core/store/mail-folder/types';

export const mailFolderPageActions = createActionGroup({
  source: 'Mail Folder Page',
  events: {
    'Payload Change': props<{ payload: MailFolderPayloadType }>()
  }
});
