import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ownerProspectActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect.actions';
import { ownerProspectApiActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-api.actions';
import { createReducer, on } from '@ngrx/store';
import { ownerProspectPageActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-page.actions';
import { OwnerProspectReducerState } from '@core/store/contact-page/owner-prospect/type';

export const ownerProspectEntityAdater: EntityAdapter<UserProperty> =
  createEntityAdapter<UserProperty>({
    selectId: (entity: UserProperty) => entity.userId
  });

const initialState: OwnerProspectReducerState =
  ownerProspectEntityAdater.getInitialState({
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

export const ownerProspectReducer = createReducer(
  initialState,
  on(ownerProspectActions.setAll, (state, { ownerProspect }) => {
    return ownerProspectEntityAdater.setAll(ownerProspect, state);
  }),
  on(ownerProspectPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(ownerProspectApiActions.getOwnerProspectSuccess, (state, { data }) => {
    const { currentPage, totalItems, totalPages, userProperties } = data;
    const newState = ownerProspectEntityAdater.setAll(userProperties, state);
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
  on(ownerProspectApiActions.getOwnerProspectFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(ownerProspectActions.getCacheSuccess, (state, { data }) => {
    if (!data.length) return state;
    return ownerProspectEntityAdater.setAll(data, {
      ...state,
      fetching: false
    });
  }),
  on(ownerProspectPageActions.nextPage, (state) => {
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
  on(ownerProspectApiActions.getNewPageSuccess, (state, { ownerProspect }) => {
    return ownerProspectEntityAdater.upsertMany(ownerProspect, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  })
);
