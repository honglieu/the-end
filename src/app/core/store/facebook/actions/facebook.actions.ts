import { FacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { createActionGroup, props } from '@ngrx/store';

export const facebookActions = createActionGroup({
  source: 'Facebook',
  events: {
    'Set All': props<{ messages: FacebookMessage[] }>(),
    'Get Cache Success': props<{ messages: FacebookMessage[] }>()
  }
});
