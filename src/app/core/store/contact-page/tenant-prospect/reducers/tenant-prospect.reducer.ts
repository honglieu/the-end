import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TenantProspectReducerState } from '@core/store/contact-page/tenant-prospect/type';
import { createReducer, on } from '@ngrx/store';
import { tenantProspectActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect.actions';
import { tenantProspectPageActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-page.actions';
import { tenantProspectApiActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-api.actions';
import { IAgency } from '@shared/types/users-by-property.interface';

export const tenantProspectEntityAdater: EntityAdapter<IAgency> =
  createEntityAdapter<IAgency>({
    selectId: (entity: IAgency) => entity.propertyId
  });

const initialState: TenantProspectReducerState =
  tenantProspectEntityAdater.getInitialState({
    firstInitial: true,
    fetching: false,
    fetchingMore: false,
    error: null,
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    isCompletedScroll: false,
    payload: {
      page: 0
    }
  });

export const tenantProspectReducer = createReducer(
  initialState,
  on(tenantProspectActions.setAll, (state, { tenantProspect }) => {
    return tenantProspectEntityAdater.setAll(tenantProspect, state);
  }),
  on(tenantProspectPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(tenantProspectApiActions.getTenantProspectSuccess, (state, { data }) => {
    const { currentPage, totalItems, totalPages, listAgencies } = data;
    const newState = tenantProspectEntityAdater.setAll(listAgencies, state);
    return {
      ...newState,
      fetching: false,
      totalItems,
      totalPages,
      currentPage,
      isCompletedScroll: true,
      firstInitial: false
    };
  }),
  on(tenantProspectApiActions.getTenantProspectFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(tenantProspectActions.getCacheSuccess, (state, { data }) => {
    if (!data.length) return state;
    return tenantProspectEntityAdater.setAll(data, {
      ...state,
      fetching: false
    });
  }),
  on(tenantProspectPageActions.nextPage, (state) => {
    const newPage = Number(state.currentPage ?? null) + 1;
    const payload = {
      ...state.payload,
      page: newPage
    };
    return {
      ...state,
      payload,
      currentPage: newPage,
      fetching: false,
      fetchingMore: true
    };
  }),
  on(
    tenantProspectApiActions.getNewPageSuccess,
    (state, { tenantProspect }) => {
      return tenantProspectEntityAdater.upsertMany(tenantProspect, {
        ...state,
        fetching: false,
        fetchingMore: false
      });
    }
  )
);
