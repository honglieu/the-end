import { createActionGroup, props } from '@ngrx/store';
import { VoiceMailMessage } from '@core/store/voice-mail/types';

export const voiceMailActions = createActionGroup({
  source: 'Voice Mail',
  events: {
    'Set All': props<{ messages: VoiceMailMessage[] }>(),
    'Get Cache Success': props<{ messages: VoiceMailMessage[] }>()
  }
});
