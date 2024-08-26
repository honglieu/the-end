import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { WhatsappReducerState } from '@/app/core/store/whatsapp/types';
import { whatsappEntityAdapter } from '@/app/core/store/whatsapp/reducers/whatsapp.reducer';

export const selectMessageState = createFeatureSelector<WhatsappReducerState>(
  StoreFeatureKey.WHATSAPP
);

export const {
  selectIds: selectMessageIds,
  selectAll: selectAllMessage,
  selectEntities: selectMessageEntities
} = whatsappEntityAdapter.getSelectors(selectMessageState);

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
