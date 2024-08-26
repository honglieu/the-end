import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { FacebookReducerState } from '@/app/core/store/facebook/types';
import { facebookEntityAdapter } from '@/app/core/store/facebook/reducers/facebook.reducer';

export const selectMessageState = createFeatureSelector<FacebookReducerState>(
  StoreFeatureKey.FACEBOOK
);

export const {
  selectIds: selectMessageIds,
  selectAll: selectAllMessage,
  selectEntities: selectMessageEntities
} = facebookEntityAdapter.getSelectors(selectMessageState);

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
