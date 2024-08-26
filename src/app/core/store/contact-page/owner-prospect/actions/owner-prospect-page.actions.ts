import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const ownerProspectPageActions = createActionGroup({
  source: 'Owner Prospect Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: ParamsTenantLandlordsProspect }>()
  }
});