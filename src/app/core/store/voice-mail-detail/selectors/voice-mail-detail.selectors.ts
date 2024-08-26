import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { voiceMailEntityAdapter } from '@core/store/voice-mail-detail/reducers/voice-mail-detail.reducer';
import { VoiceMailDetailReducerState } from '@core/store/voice-mail-detail/types';

export const selectVoiceMailDetailMailState =
  createFeatureSelector<VoiceMailDetailReducerState>(
    StoreFeatureKey.VOICE_MAIL_DETAIL
  );

export const { selectIds: selectMessageIds } =
  voiceMailEntityAdapter.getSelectors(selectVoiceMailDetailMailState);

export const selectFetching = createSelector(
  selectVoiceMailDetailMailState,
  (messageState) => messageState.fetching
);

export const selectCurrentTaskId = createSelector(
  selectVoiceMailDetailMailState,
  (state) => state.currentTaskId
);

export const selectCurrentConversationId = createSelector(
  selectVoiceMailDetailMailState,
  (state) => state.currentConversationId
);

export const selectTask = createSelector(
  selectVoiceMailDetailMailState,
  (state) => state.task
);

export const selectMessages = createSelector(
  selectVoiceMailDetailMailState,
  (state) => state.messages
);
