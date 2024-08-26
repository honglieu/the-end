import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { TenantProspectReducerState } from '@core/store/contact-page/tenant-prospect/type';
import { tenantProspectEntityAdater } from '@core/store/contact-page/tenant-prospect/reducers/tenant-prospect.reducer';

export const selectTenantProspectState =
  createFeatureSelector<TenantProspectReducerState>(
    StoreFeatureKey.TENANT_PROSPECT
  );

export const {
  selectIds: selectTenantProspectIds,
  selectAll: selectAllTenantProspect,
  selectEntities: selectTenantProspectEntities
} = tenantProspectEntityAdater.getSelectors(selectTenantProspectState);

export const selectTotalItemsTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.totalItems
);

export const selectCurrentPageTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.currentPage
);

export const selectTotalPagesTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.totalPages
);

export const selectFetchingTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.fetching
);

export const selectFristInitialTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.firstInitial
);

export const selectFetchingMoreTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.fetchingMore
);

export const selectIsCompletedScrollTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.isCompletedScroll
);

export const selectMessagePayloadTenantProspect = createSelector(
  selectTenantProspectState,
  (state) => state.payload
);
