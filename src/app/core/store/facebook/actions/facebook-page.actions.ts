import { IFacebookQueryParams } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const facebookPageActions = createActionGroup({
  source: 'Facebook Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IFacebookQueryParams }>()
  }
});
