import { createFeature } from '@ngrx/store';
import { otherContactReducer } from './reducers/other-contact.reducer';
import { StoreFeatureKey } from '@core/store/feature.enum';

export const otherContactFeature = createFeature({
  name: StoreFeatureKey.OTHER_CONTACT,
  reducer: otherContactReducer
});
