import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { createActionGroup, props } from '@ngrx/store';
import { IDBTenantProspect } from '@core/store/contact-page/tenant-prospect/type';
import { IAgency } from '@shared/types/users-by-property.interface';

export const tenantProspectApiActions = createActionGroup({
  source: 'Tenant Prospect API',
  events: {
    'Get Tenant Prospect Success': props<{
      data?: IDBTenantProspect;
      payload?: ParamsTenantLandlordsProspect;
    }>(),
    'Get New Page Success': props<{
      tenantProspect?: Array<IAgency>;
    }>(),
    'Get Tenant Prospect Failure': props<{ error: unknown }>()
  }
});
