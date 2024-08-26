import { WhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { createActionGroup, props } from '@ngrx/store';

export const whatsappActions = createActionGroup({
  source: 'Whatsapp',
  events: {
    'Set All': props<{ messages: WhatsappMessage[] }>(),
    'Get Cache Success': props<{ messages: WhatsappMessage[] }>()
  }
});
