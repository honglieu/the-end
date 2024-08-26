import { IEmailQueryParams } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const messagesMailFolderPageActions = createActionGroup({
  source: 'Messages Mail Folder Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Page Change': props<{
      pageIndex: number;
    }>(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IEmailQueryParams }>()
  }
});
