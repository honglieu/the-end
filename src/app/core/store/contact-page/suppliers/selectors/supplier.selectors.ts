import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { supplierEntityAdater } from '@core/store/contact-page/suppliers/reducers/supplier.reducer';
import { SupplierReducerState } from '@core/store/contact-page/suppliers/type';

export const selectSupplierState = createFeatureSelector<SupplierReducerState>(
  StoreFeatureKey.SUPPLIER
);

export const {
  selectIds: selectSupplierIds,
  selectAll: selectAllSupplier,
  selectEntities: selectSupplierEntities
} = supplierEntityAdater.getSelectors(selectSupplierState);

export const selectTotalItemsSupplier = createSelector(
  selectSupplierState,
  (state) => state.totalItems
);

export const selectCurrentPageSupplier = createSelector(
  selectSupplierState,
  (state) => state.currentPage
);

export const selectTotalPagesSupplier = createSelector(
  selectSupplierState,
  (state) => state.totalPages
);

export const selectFetchingSupplier = createSelector(
  selectSupplierState,
  (state) => state.fetching
);

export const selectFirstInitialSupplier = createSelector(
  selectSupplierState,
  (state) => state.firstInitial
);

export const selectFetchingMoreSupplier = createSelector(
  selectSupplierState,
  (state) => state.fetchingMore
);

export const selectIsCompletedScroll = createSelector(
  selectSupplierState,
  (state) => state.isCompletedScroll
);

export const selectMessagePayloadSupplier = createSelector(
  selectSupplierState,
  (state) => state.payload
);
