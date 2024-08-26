import { createActionGroup, props } from '@ngrx/store';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { ISocketBulkMail } from '@shared/types/socket.interface';

export const tenantsOwnersActions = createActionGroup({
  source: 'Tenant Owners Page',
  events: {
    'Set All': props<{ tenantsOwners: IAgentUserProperties[] }>(),
    'Get Cache Success': props<{ data: IAgentUserProperties[] }>(),
    'Socket Bulk Email': props<{ data: ISocketBulkMail }>(),
    'Update List': props<{ data: IAgentUserProperties[] }>()
  }
});
