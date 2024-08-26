import { ParamsTenantsLandlords } from '@/app/user/utils/user.type';
import { createActionGroup, props } from '@ngrx/store';
import { IDBIUsersByProperty } from '@core/store/contact-page/tenants-owners/type';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';

export const tenantsOwnersApiActions = createActionGroup({
  source: 'Tenants Owners API',
  events: {
    'Get Tenants Owners Success': props<{
      data?: IDBIUsersByProperty;
      payload?: ParamsTenantsLandlords;
    }>(),
    'Get Tenants Owners Failure': props<{ error: unknown }>(),
    'Get New Page Tenants Owners': props<{
      tenantsOwners?: Array<IAgentUserProperties>;
    }>()
  }
});
