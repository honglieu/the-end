import { OtherContact } from '@shared/types/other-contact.interface';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { OtherContactReducerState } from '@core/store/contact-page/other-contact/type';
import { otherContactActions } from '@core/store/contact-page/other-contact/actions/other-contact.actions';
import { otherContactPageActions } from '@core/store/contact-page/other-contact/actions/other-contact-page.actions';
import { otherContactApiActions } from '@core/store/contact-page/other-contact/actions/other-contact-api.actions';

export const otherContactEntityAdapter: EntityAdapter<OtherContact> =
  createEntityAdapter<OtherContact>({
    selectId: (entity: OtherContact) => {
      return entity.id;
    },
    sortComparer: (a: OtherContact, b: OtherContact) =>
      a.sendFrom.localeCompare(b.sendFrom)
  });
const initialState: OtherContactReducerState =
  otherContactEntityAdapter.getInitialState({
    fetching: false,
    fetchingMore: false,
    error: null,
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    isCompletedScroll: false,
    payload: {
      page: 0,
      size: 20
    }
  });
export const otherContactReducer = createReducer(
  initialState,
  on(otherContactActions.setAll, (state, { otherContacts }) => {
    return otherContactEntityAdapter.setAll(otherContacts, state);
  }),
  on(otherContactPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(otherContactApiActions.getOtherContactSuccess, (state, { data }) => {
    const { currentPage, totalItems, totalPages, items } = data;
    const newState = otherContactEntityAdapter.setAll(items, state);
    return {
      ...newState,
      fetching: false,
      totalItems,
      totalPages,
      currentPage,
      isCompletedScroll: true
    };
  }),
  on(otherContactApiActions.getOtherContactFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(otherContactActions.getCacheOtherContactSuccess, (state, { data }) => {
    if (!data.length) return state;
    return otherContactEntityAdapter.setAll(data, {
      ...state,
      fetching: false
    });
  }),
  on(otherContactPageActions.exitPage, (state) => {
    return {
      ...state,
      currentPage: 0
    };
  }),
  on(otherContactPageActions.nextPage, (state) => {
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
      fetchingMore: true,
      isCompletedScroll: false
    };
  }),
  on(
    otherContactApiActions.getNewPageOtherContact,
    (state, { otherContact }) => {
      return otherContactEntityAdapter.upsertMany(otherContact, {
        ...state,
        fetching: false,
        fetchingMore: false,
        isCompletedScroll: true
      });
    }
  )
);
