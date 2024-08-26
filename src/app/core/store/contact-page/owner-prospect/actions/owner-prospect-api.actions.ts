import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { createActionGroup, props } from '@ngrx/store';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { IDBOwnerProspect } from '@core/store/contact-page/owner-prospect/type';

export const ownerProspectApiActions = createActionGroup({
  source: 'Owner Prospect API',
  events: {
    'Get Owner Prospect Success': props<{
      data?: IDBOwnerProspect;
      payload?: ParamsTenantLandlordsProspect;
    }>(),
    'Get New Page Success': props<{
      ownerProspect?: Array<UserProperty>;
    }>(),
    'Get Owner Prospect Failure': props<{ error: unknown }>()
  }
});
