import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { AppMessageReducerState } from '@core/store/app-message/types';
import { appMessageEntityAdapter } from '@core/store/app-message/reducers/app-message.reducer';

export const selectAppMessageState =
  createFeatureSelector<AppMessageReducerState>(StoreFeatureKey.APP_MESSAGE);

export const {
  selectIds: selectAppMessageIds,
  selectAll: selectAllAppMessage,
  selectEntities: selectAppMessageEntities
} = appMessageEntityAdapter.getSelectors(selectAppMessageState);

export const selectFetchingMessage = createSelector(
  selectAppMessageState,
  (messageState) => messageState.fetching
);

export const selectTotalMessage = createSelector(
  selectAppMessageState,
  (messageState) => messageState.total
);

export const selectFetchingMoreMessage = createSelector(
  selectAppMessageState,
  (messageState) => messageState.fetchingMore
);

export const selectMessagePayload = createSelector(
  selectAppMessageState,
  (messageState) => messageState.payload
);
