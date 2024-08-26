import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FacebookMessage,
  FacebookReducerState
} from '@/app/core/store/facebook/types';
import { facebookPageActions } from '@/app/core/store/facebook/actions/facebook-page.actions';
import { facebookApiActions } from '@/app/core/store/facebook/actions/facebook-api.actions';
import { facebookActions } from '@/app/core/store/facebook/actions/facebook.actions';

const getTime = (date: string) => new Date(date).getTime();

export const facebookEntityAdapter: EntityAdapter<FacebookMessage> =
  createEntityAdapter<FacebookMessage>({
    selectId: (facebook: FacebookMessage) => facebook.conversationId,
    sortComparer: (a: FacebookMessage, b: FacebookMessage) => {
      return getTime(b?.endSession) - getTime(a?.endSession);
    }
  });

const initialState: FacebookReducerState =
  facebookEntityAdapter.getInitialState({
    total: 0,
    fetchingMore: false,
    fetching: false,
    error: null,
    scrollTopIndex: null,
    scrollBottomIndex: null,
    payload: {
      page: 0,
      limit: 20,
      pageLimit: 20
    }
  });

export const facebookReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(facebookPageActions.nextPage, (state) => {
    const totalLoaded = Object.keys(state.entities).length;
    if (totalLoaded >= state.total) {
      return state;
    }

    const newPage = Number(state.scrollBottomIndex ?? null) + 1;
    const payload = {
      ...state.payload,
      currentTaskId: null,
      page: newPage
    };
    return {
      ...state,
      payload,
      scrollBottomIndex: newPage,
      fetching: false,
      fetchingMore: true
    };
  }),

  on(facebookPageActions.prevPage, (state) => {
    const currentPage = Number(state.scrollTopIndex ?? null);
    if (currentPage === 0) {
      return state;
    }
    const newPage = currentPage > 0 ? currentPage - 1 : 0;
    const payload = {
      ...state.payload,
      currentTaskId: null,
      page: newPage
    };

    return {
      ...state,
      payload,
      scrollTopIndex: newPage,
      fetching: false,
      fetchingMore: true
    };
  }),

  on(facebookPageActions.exitPage, (state) =>
    facebookEntityAdapter.removeAll(state)
  ),

  on(facebookPageActions.payloadChange, (state, { payload }) => {
    // debugger;
    // initial or has search/filter
    if (payload?.page === 0) {
      return {
        ...state,
        payload,
        scrollTopIndex: payload.page,
        scrollBottomIndex: payload.page,
        fetching: true
      };
    }
    return {
      ...state,
      payload,
      scrollTopIndex: Number.isInteger(state.scrollTopIndex)
        ? state.scrollTopIndex
        : payload.page,
      scrollBottomIndex: Number.isInteger(state.scrollBottomIndex)
        ? state.scrollBottomIndex
        : payload.page,
      fetching: true
    };
  }),
  // #endregion

  // #endregion Message API Actions
  on(
    facebookApiActions.getFacebookSuccess,
    (state, { messages, total, currentPage, payload }) => {
      const newState = facebookEntityAdapter.setAll(messages, state);
      const shouldLoadMorePagesInPrevious =
        payload.currentTaskId &&
        messages.findIndex((message) => message.id === payload.currentTaskId) >=
          0 &&
        currentPage > 0 &&
        currentPage === Math.ceil(total / 20) - 1 &&
        messages.length < 20;

      return {
        ...newState,
        fetching: false,
        fetchingMore: !!shouldLoadMorePagesInPrevious,
        total: total ?? state.total,
        scrollBottomIndex: currentPage ?? state.scrollBottomIndex,
        scrollTopIndex: currentPage ?? state.scrollTopIndex,
        payload: {
          ...state.payload,
          page: currentPage ?? state.payload.page
        }
      };
    }
  ),

  on(facebookApiActions.getNewPageSuccess, (state, { messages }) => {
    return facebookEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(facebookApiActions.getFacebookFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(facebookActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }

    return facebookEntityAdapter.setAll(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(facebookActions.setAll, (state, { messages }) => {
    return facebookEntityAdapter.setAll(messages, state);
  })
  // #endregion
);
