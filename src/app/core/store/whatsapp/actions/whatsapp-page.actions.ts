import { IWhatsappQueryParams } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const whatsappPageActions = createActionGroup({
  source: 'Whatsapp Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IWhatsappQueryParams }>()
  }
});
