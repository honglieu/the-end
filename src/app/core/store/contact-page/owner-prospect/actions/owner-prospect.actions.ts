import { UserProperty } from '@shared/types/users-by-property.interface';
import { createActionGroup, props } from '@ngrx/store';

export const ownerProspectActions = createActionGroup({
  source: 'Owner Prospect',
  events: {
    'Set All': props<{ ownerProspect: Array<UserProperty> }>(),
    'Get Cache Success': props<{ data: Array<UserProperty> }>()
  }
});
