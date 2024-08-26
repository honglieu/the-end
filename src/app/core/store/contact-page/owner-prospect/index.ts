import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { ownerProspectReducer } from './reducers/owner-prospect.reducer';

export const ownerProspectFeature = createFeature({
  name: StoreFeatureKey.OWNER_PROSPECT,
  reducer: ownerProspectReducer
});
