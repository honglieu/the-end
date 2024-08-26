import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TenantsOwnersReducerState } from '@core/store/contact-page/tenants-owners/type';
import { createReducer, on } from '@ngrx/store';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { tenantsOwnersActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt.actions';
import { tenantsOwnersPageActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-page.actions';
import { tenantsOwnersApiActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-api.actions';

export const tenantsOwnersEntityAdapter: EntityAdapter<IAgentUserProperties> =
  createEntityAdapter<IAgentUserProperties>({
    selectId: (entity: IAgentUserProperties) => {
      return entity.propertyId;
    },
    sortComparer: (a: IAgentUserProperties, b: IAgentUserProperties) => {
      return a.order - b.order;
    }
  });

const initialState: TenantsOwnersReducerState =
  tenantsOwnersEntityAdapter.getInitialState({
    firstInitial: true,
    fetching: false,
    fetchingMore: false,
    error: null,
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    isCompletedScroll: false,
    payload: {
      page: String(0),
      limit: 20,
      pageLimit: 20
    }
  });

export const tenantsOwnersPtReducer = createReducer(
  initialState,
  on(tenantsOwnersActions.setAll, (state, { tenantsOwners }) => {
    return tenantsOwnersEntityAdapter.setAll(tenantsOwners, state);
  }),
  on(tenantsOwnersPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      currentPage: 0,
      fetching: true
    };
  }),
  on(tenantsOwnersApiActions.getTenantsOwnersSuccess, (state, { data }) => {
    const { propertyContacts, totalItems, totalPages, currentPage } = data;
    const newState = tenantsOwnersEntityAdapter.setAll(propertyContacts, state);
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
  on(tenantsOwnersApiActions.getTenantsOwnersFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(tenantsOwnersActions.getCacheSuccess, (state, { data }) => {
    if (!data.length) {
      return state;
    }
    return tenantsOwnersEntityAdapter.setAll(data, {
      ...state,
      fetching: false
    });
  }),
  on(tenantsOwnersPageActions.nextPage, (state) => {
    const newPage = Number(state.currentPage ?? null) + 1;
    const payload = {
      ...state.payload,
      page: String(newPage)
    };
    return {
      ...state,
      payload,
      currentPage: newPage,
      fetching: false,
      fetchingMore: true,
      isCompletedScroll: false
    };
  }),
  on(
    tenantsOwnersApiActions.getNewPageTenantsOwners,
    (state, { tenantsOwners }) => {
      return tenantsOwnersEntityAdapter.upsertMany(tenantsOwners, {
        ...state,
        fetching: false,
        fetchingMore: false,
        isCompletedScroll: true
      });
    }
  ),
  on(tenantsOwnersPageActions.exitPage, (state) => {
    return {
      ...state,
      currentPage: 0
    };
  })
);
