import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { messageReducer } from './reducers/message.reducer';

export { messagePageActions } from './actions/message-page.actions';
export { MessageEffects } from './effects/message.effects';
export * from './reducers/message.reducer';
export * from './selectors/message.selectors';
export { MessageMemoryCacheService } from './services/message-memory-cache.service';
export { MessageReducerState } from './types';

export const messageFeature = createFeature({
  name: StoreFeatureKey.MESSAGE,
  reducer: messageReducer
});
