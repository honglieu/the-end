import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { tenantsOwnersRmReducer } from './reducers/tenants-owners-rm.reducer';

export const tenantsOwnersRmFeature = createFeature({
  name: StoreFeatureKey.TENANTS_OWNERS_RM,
  reducer: tenantsOwnersRmReducer
});
