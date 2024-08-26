import { createActionGroup, props } from '@ngrx/store';
import { VoiceMailMessage } from '@core/store/voice-mail/types';
import { IVoiceMailQueryParams } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';

export const voiceMailApiActions = createActionGroup({
  source: 'Voice Mail API',
  events: {
    'Get Voice Mail Success': props<{
      messages?: Array<VoiceMailMessage>;
      total?: number;
      currentPage?: number;
      payload?: IVoiceMailQueryParams;
    }>(),
    'Get New Page Success': props<{
      messages?: Array<VoiceMailMessage>;
      total?: number;
      currentPage?: number;
      payload?: IVoiceMailQueryParams;
    }>(),
    'Get Voice Mail Failure': props<{ error: boolean }>()
  }
});
