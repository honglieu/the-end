import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { facebookDetailReducer } from './reducers/facebook-detail.reducer';
export { FacebookDetailTaskMemoryCacheService } from './services/facebook-detail-task-memory-cache.service';
export { FacebookDetailEffects } from './effects/facebook-detail.effects';
export * from './reducers/facebook-detail.reducer';
export * from './selectors/facebook-detail.selectors';
export { FacebookDetailReducerState } from './types';

export const facebookDetailFeature = createFeature({
  name: StoreFeatureKey.FACEBOOK_DETAIL,
  reducer: facebookDetailReducer
});
