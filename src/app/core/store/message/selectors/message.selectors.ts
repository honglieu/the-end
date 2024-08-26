import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { MessageReducerState } from '@core/store/message/types';
import { messageEntityAdapter } from '@core/store/message/reducers/message.reducer';

export const selectMessageState = createFeatureSelector<MessageReducerState>(
  StoreFeatureKey.MESSAGE
);

export const {
  selectIds: selectMessageIds,
  selectAll: selectAllMessage,
  selectEntities: selectMessageEntities
} = messageEntityAdapter.getSelectors(selectMessageState);

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

export const selectListMessageError = createSelector(
  selectMessageState,
  (messageState) => messageState.error
);
