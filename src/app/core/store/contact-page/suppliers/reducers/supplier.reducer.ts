import { SupplierProperty } from '@shared/types/users-supplier.interface';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { SupplierReducerState } from '@core/store/contact-page/suppliers/type';
import { createReducer, on } from '@ngrx/store';
import { supplierActions } from '@core/store/contact-page/suppliers/actions/supplier.actions';
import { supplierPageActions } from '@core/store/contact-page/suppliers/actions/supplier-page.actions';
import { supplierApiActions } from '@core/store/contact-page/suppliers/actions/supplier-api.actions';

export const supplierEntityAdater: EntityAdapter<SupplierProperty> =
  createEntityAdapter<SupplierProperty>({
    selectId: (entity: SupplierProperty) => entity.id,
    sortComparer: (a, b) => {
      return a.lastName.localeCompare(b.lastName);
    }
  });

const initialState: SupplierReducerState = supplierEntityAdater.getInitialState(
  {
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
  }
);

export const supplierReducer = createReducer(
  initialState,
  on(supplierActions.setAll, (state, { suppliers }) => {
    return supplierEntityAdater.setAll(suppliers, state);
  }),
  on(supplierPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(supplierApiActions.getSupplierSuccess, (state, { data }) => {
    const { currentPage, totalItems, totalPages, list } = data;
    const newState = supplierEntityAdater.setAll(list, state);
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
  on(supplierApiActions.getSupplierFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(supplierActions.getCacheSuccess, (state, { data }) => {
    if (!data.length) return state;
    return supplierEntityAdater.setAll(data, {
      ...state,
      fetching: false
    });
  }),
  on(supplierPageActions.nextPage, (state) => {
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
  on(supplierApiActions.getNewPageSuccess, (state, { suppliers }) => {
    return supplierEntityAdater.upsertMany(suppliers, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  })
);
