import { createActionGroup, props } from '@ngrx/store';
import { FacebookMessage } from '@/app/core/store/facebook/types';
import { IFacebookQueryParams } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export const facebookApiActions = createActionGroup({
  source: 'Facebook API',
  events: {
    'Get Facebook Success': props<{
      messages?: Array<FacebookMessage>;
      total?: number;
      currentPage?: number;
      payload?: IFacebookQueryParams;
    }>(),
    'Get New Page Success': props<{
      messages?: Array<FacebookMessage>;
      total?: number;
      currentPage?: number;
      payload?: IFacebookQueryParams;
    }>(),
    'Get Facebook Failure': props<{ error: unknown }>()
  }
});
