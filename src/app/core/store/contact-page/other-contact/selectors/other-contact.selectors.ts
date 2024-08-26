import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { otherContactEntityAdapter } from '@core/store/contact-page/other-contact/reducers/other-contact.reducer';
import { OtherContactReducerState } from '@core/store/contact-page/other-contact/type';

export const selectOtherContactState =
  createFeatureSelector<OtherContactReducerState>(
    StoreFeatureKey.OTHER_CONTACT
  );

export const {
  selectIds: selectOtherContactIds,
  selectAll: selectAllOtherContact,
  selectEntities: selectOtherContactEntities
} = otherContactEntityAdapter.getSelectors(selectOtherContactState);

export const selectTotalItemsOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.totalItems
);

export const selectCurrentPageOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.currentPage
);

export const selectTotalPagesOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.totalPages
);

export const selectFetchingOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.fetching
);

export const selectFetchingMoreOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.fetchingMore
);

export const selectMessagePayloadOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.payload
);

export const selectIsCompletedScrollOtherContact = createSelector(
  selectOtherContactState,
  (state) => state.isCompletedScroll
);
