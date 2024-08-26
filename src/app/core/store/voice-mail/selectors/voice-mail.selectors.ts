import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { VoiceMailReducerState } from '@core/store/voice-mail/types';
import { voiceMailEntityAdapter } from '@core/store/voice-mail/reducers/voice-mail.reducer';

export const selectMessageState = createFeatureSelector<VoiceMailReducerState>(
  StoreFeatureKey.VOICE_MAIL
);

export const {
  selectIds: selectMessageIds,
  selectAll: selectAllMessage,
  selectEntities: selectMessageEntities
} = voiceMailEntityAdapter.getSelectors(selectMessageState);

export const selectFetchingMessage = createSelector(
  selectMessageState,
  (messageState) => messageState.fetching
);

export const selectTotalMessage = createSelector(
  selectMessageState,
  (messageState) => messageState.total
);

export const selectFetchingMoreMessage = createSelector(
  selectMessageState,
  (messageState) => messageState.fetchingMore
);

export const selectMessagePayload = createSelector(
  selectMessageState,
  (messageState) => messageState.payload
);
