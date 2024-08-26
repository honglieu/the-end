import { IAgency } from '@shared/types/users-by-property.interface';
import { createActionGroup, props } from '@ngrx/store';

export const tenantProspectActions = createActionGroup({
  source: 'Tenant Prospect Page',
  events: {
    'Set All': props<{ tenantProspect: Array<IAgency> }>(),
    'Get Cache Success': props<{ data: Array<IAgency> }>()
  }
});
