import { ParamsTenantsLandlords } from '@/app/user/utils/user.type';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const tenantsOwnersPageActions = createActionGroup({
  source: 'Tenants Owners PT Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload }>()
  }
});
