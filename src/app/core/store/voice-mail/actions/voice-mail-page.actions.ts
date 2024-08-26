import { IVoiceMailQueryParams } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const voiceMailPageActions = createActionGroup({
  source: 'Voice Mail Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IVoiceMailQueryParams }>()
  }
});
