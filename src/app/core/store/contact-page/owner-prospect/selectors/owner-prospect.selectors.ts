import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { ownerProspectEntityAdater } from '@core/store/contact-page/owner-prospect/reducers/owner-prospect.reducer';
import { OwnerProspectReducerState } from '@core/store/contact-page/owner-prospect/type';

export const selectOwnerProspectState =
  createFeatureSelector<OwnerProspectReducerState>(
    StoreFeatureKey.OWNER_PROSPECT
  );

export const {
  selectIds: selectOwnerProspectIds,
  selectAll: selectAllOwnerProspect,
  selectEntities: selectOwnerProspectEntities
} = ownerProspectEntityAdater.getSelectors(selectOwnerProspectState);

export const selectTotalItemsOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.totalItems
);

export const selectCurrentPageOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.currentPage
);

export const selectTotalPagesOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.totalPages
);

export const selectFetchingOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.fetching
);

export const selectFirstInitialOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.firstInitial
);

export const selectFetchingMoreOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.fetchingMore
);

export const selectIsCompletedScrollOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.isCompletedScroll
);

export const selectMessagePayloadOwnerProspect = createSelector(
  selectOwnerProspectState,
  (state) => state.payload
);
