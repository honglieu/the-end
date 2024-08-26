import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { tenantProspectReducer } from './reducers/tenant-prospect.reducer';

export const tenantProspectFeature = createFeature({
  name: StoreFeatureKey.TENANT_PROSPECT,
  reducer: tenantProspectReducer
});
