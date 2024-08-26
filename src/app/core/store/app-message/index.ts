import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { appMessageReducer } from './reducers/app-message.reducer';

export { AppMessageReducerState } from './types';
export { AppMessageEffects } from './effects/app-message.effects';
export { appMessagePageActions } from './actions/app-message-page.actions';
export { AppMessageMemoryCacheService } from './services/app-message-memory-cache.service';
export * from './reducers/app-message.reducer';
export * from './selectors/message.selectors';

export const appMessageFeature = createFeature({
  name: StoreFeatureKey.APP_MESSAGE,
  reducer: appMessageReducer
});
