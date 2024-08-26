import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { voiceMailReducer } from './reducers/voice-mail.reducer';

export { voiceMailPageActions } from './actions/voice-mail-page.actions';
export { VoiceMailEffects } from './effects/voice-mail.effects';
export * from './reducers/voice-mail.reducer';
export * from './selectors/voice-mail.selectors';
export { VoiceMailMemoryCacheService } from './services/voice-mail-memory-cache.service';
export { VoiceMailReducerState } from './types';

export const voiceMailFeature = createFeature({
  name: StoreFeatureKey.VOICE_MAIL,
  reducer: voiceMailReducer
});
