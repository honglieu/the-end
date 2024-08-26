import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { whatsappReducer } from './reducers/whatsapp.reducer';

export { whatsappPageActions } from './actions/whatsapp-page.actions';
export { WhatsappEffects } from './effects/whatsapp.effects';
export * from './reducers/whatsapp.reducer';
export * from './selectors/whatsapp.selectors';
export { WhatsappMemoryCacheService } from './services/whatsapp-memory-cache.service';
export { WhatsappReducerState } from './types';

export const whatsappFeature = createFeature({
  name: StoreFeatureKey.WHATSAPP,
  reducer: whatsappReducer
});
