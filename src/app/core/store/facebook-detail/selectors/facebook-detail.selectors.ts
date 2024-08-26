import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { facebookEntityAdapter } from '@/app/core/store/facebook-detail/reducers/facebook-detail.reducer';
import { FacebookDetailReducerState } from '@/app/core/store/facebook-detail/types';

export const selectFacebookDetailState =
  createFeatureSelector<FacebookDetailReducerState>(
    StoreFeatureKey.FACEBOOK_DETAIL
  );

export const { selectIds: selectMessageIds } =
  facebookEntityAdapter.getSelectors(selectFacebookDetailState);

export const selectCurrentTaskId = createSelector(
  selectFacebookDetailState,
  (state) => state.currentTaskId
);

export const selectCurrentConversationId = createSelector(
  selectFacebookDetailState,
  (state) => state.currentConversationId
);

export const selectTask = createSelector(
  selectFacebookDetailState,
  (state) => state.task
);

export const selectMessages = createSelector(
  selectFacebookDetailState,
  (state) => state.messages
);

export const selectFetching = createSelector(
  selectFacebookDetailState,
  (state) => state.fetching
);
