import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { tenantsOwnersPtReducer } from './reducers/tenants-owners-pt.reducer';

export const tenantsOwnersPtFeature = createFeature({
  name: StoreFeatureKey.TENANTS_OWNERS_PT,
  reducer: tenantsOwnersPtReducer
});
