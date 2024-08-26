import { createActionGroup, props } from '@ngrx/store';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';

export const tenantsOwnersActions = createActionGroup({
  source: 'Tenant Owners PT Page',
  events: {
    'Set All': props<{ tenantsOwners: IAgentUserProperties[] }>(),
    'Get Cache Success': props<{ data: IAgentUserProperties[] }>()
  }
});
