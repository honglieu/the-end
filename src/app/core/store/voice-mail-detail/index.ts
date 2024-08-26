import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { voiceMailDetailReducer } from './reducers/voice-mail-detail.reducer';
export { VoiceMailDetailEffects } from './effects/voice-mail-detail.effects';
export * from './reducers/voice-mail-detail.reducer';
export * from './selectors/voice-mail-detail.selectors';
export { VoicemailDetailTaskMemoryCacheService } from './services/voice-mail-detail-task-memory-cache.service';
export { VoicemailDetailMessagesMemoryCacheService } from './services/voice-mail-detail-messages-memory-cache.service';
export { VoiceMailDetailReducerState } from './types';

export const voiceMailDetailFeature = createFeature({
  name: StoreFeatureKey.VOICE_MAIL_DETAIL,
  reducer: voiceMailDetailReducer
});
