import { createActionGroup, props } from '@ngrx/store';
import { WhatsappMessage } from '@/app/core/store/whatsapp/types';
import { IWhatsappQueryParams } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

export const whatsappApiActions = createActionGroup({
  source: 'Whatsapp API',
  events: {
    'Get Whatsapp Success': props<{
      messages?: Array<WhatsappMessage>;
      total?: number;
      currentPage?: number;
      payload?: IWhatsappQueryParams;
    }>(),
    'Get New Page Success': props<{
      messages?: Array<WhatsappMessage>;
      total?: number;
      currentPage?: number;
      payload?: IWhatsappQueryParams;
    }>(),
    'Get Whatsapp Failure': props<{ error: unknown }>()
  }
});
