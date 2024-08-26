import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { whatsappDetailReducer } from './reducers/whatsapp-detail.reducer';
export { WhatsappDetailTaskMemoryCacheService } from './services/whatsapp-detail-task-memory-cache.service';
export { WhatsappDetailEffects } from './effects/whatsapp-detail.effects';
export * from './reducers/whatsapp-detail.reducer';
export * from './selectors/whatsapp-detail.selectors';
export { WhatsappDetailReducerState } from './types';

export const whatsappDetailFeature = createFeature({
  name: StoreFeatureKey.WHATSAPP_DETAIL,
  reducer: whatsappDetailReducer
});
