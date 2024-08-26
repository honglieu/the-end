import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { tenantsOwnersEntityAdapter } from '@core/store/contact-page/tenants-owners/rent-manager/reducers/tenants-owners-rm.reducer';
import { TenantsOwnersReducerState } from '@core/store/contact-page/tenants-owners/type';

export const selectTenantOwnersRmState =
  createFeatureSelector<TenantsOwnersReducerState>(
    StoreFeatureKey.TENANTS_OWNERS_RM
  );

export const {
  selectIds: selectTenantsOwnersIds,
  selectAll: selectAllTenantsOwners,
  selectEntities: selectTenantsOwnersEntities
} = tenantsOwnersEntityAdapter.getSelectors(selectTenantOwnersRmState);

export const selectTotalItems = createSelector(
  selectTenantOwnersRmState,
  (state) => state.totalItems
);

export const selectCurrentPage = createSelector(
  selectTenantOwnersRmState,
  (state) => state.currentPage
);

export const selectTotalPages = createSelector(
  selectTenantOwnersRmState,
  (state) => state.totalPages
);

export const selectFetchingTenantsOwners = createSelector(
  selectTenantOwnersRmState,
  (state) => state.fetching
);

export const selectFirstInitial = createSelector(
  selectTenantOwnersRmState,
  (state) => state.firstInitial
);

export const selectFetchingMoreTenantsOwners = createSelector(
  selectTenantOwnersRmState,
  (state) => state.fetchingMore
);

export const selectIsCompedScrollTenantsOwners = createSelector(
  selectTenantOwnersRmState,
  (state) => state.isCompletedScroll
);

export const selectPayloadTenantsOwners = createSelector(
  selectTenantOwnersRmState,
  (state) => state.payload
);
