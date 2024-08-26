import { createActionGroup, props } from '@ngrx/store';
import {
  MailFolder,
  MailFolderPayloadType
} from '@core/store/mail-folder/types';

export const mailFolderApiActions = createActionGroup({
  source: 'Mail Folder API',
  events: {
    'Get Mail Folder Success': props<{
      mailFolders?: Array<MailFolder>;
      payload?: MailFolderPayloadType;
    }>(),
    'Get Mail Folder Failure': props<{ error: unknown }>()
  }
});
