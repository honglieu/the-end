import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { TenantsOwnersReducerState } from '@core/store/contact-page/tenants-owners/type';
import { tenantsOwnersEntityAdapter } from '@core/store/contact-page/tenants-owners/property-tree/reducers/tenants-owners-pt.reducer';

export const selectTenantOwnersPtState =
  createFeatureSelector<TenantsOwnersReducerState>(
    StoreFeatureKey.TENANTS_OWNERS_PT
  );

export const {
  selectIds: selectTenantsOwnersIds,
  selectAll: selectAllTenantsOwners,
  selectEntities: selectTenantsOwnersEntities
} = tenantsOwnersEntityAdapter.getSelectors(selectTenantOwnersPtState);

export const selectTotalItems = createSelector(
  selectTenantOwnersPtState,
  (state) => state.totalItems
);

export const selectCurrentPage = createSelector(
  selectTenantOwnersPtState,
  (state) => state.currentPage
);

export const selectTotalPages = createSelector(
  selectTenantOwnersPtState,
  (state) => state.totalPages
);

export const selectFetchingTenantsOwners = createSelector(
  selectTenantOwnersPtState,
  (state) => state.fetching
);

export const selectFirstInitialTenantsOwners = createSelector(
  selectTenantOwnersPtState,
  (state) => state.firstInitial
);

export const selectFetchingMoreTenantsOwners = createSelector(
  selectTenantOwnersPtState,
  (state) => state.fetchingMore
);

export const selectIsCompletedScrollTenantsOwners = createSelector(
  selectTenantOwnersPtState,
  (state) => state.isCompletedScroll
);

export const selectPayloadTenantsOwners = createSelector(
  selectTenantOwnersPtState,
  (state) => state.payload
);
