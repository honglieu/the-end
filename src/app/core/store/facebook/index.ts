import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { facebookReducer } from './reducers/facebook.reducer';

export { facebookPageActions } from './actions/facebook-page.actions';
export { FacebookEffects } from './effects/facebook.effects';
export * from './reducers/facebook.reducer';
export * from './selectors/facebook.selectors';
export { FacebookMemoryCacheService } from './services/facebook-memory-cache.service';
export { FacebookReducerState } from './types';

export const facebookFeature = createFeature({
  name: StoreFeatureKey.FACEBOOK,
  reducer: facebookReducer
});
