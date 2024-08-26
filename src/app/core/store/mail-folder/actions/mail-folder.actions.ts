import { createActionGroup, props } from '@ngrx/store';
import {
  MailFolder,
  MailFolderPayloadType
} from '@core/store/mail-folder/types';

export const mailFolderActions = createActionGroup({
  source: 'Mail Folder Page',
  events: {
    'Set All Mail Folder To Cache': props<{
      mailFolders: MailFolder[];
      payload: MailFolderPayloadType;
    }>(),
    'Get Cache Success': props<{ mailFolders: MailFolder[] }>()
  }
});
