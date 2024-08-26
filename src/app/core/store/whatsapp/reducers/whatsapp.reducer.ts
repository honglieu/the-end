import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  WhatsappMessage,
  WhatsappReducerState
} from '@/app/core/store/whatsapp/types';
import { whatsappPageActions } from '@/app/core/store/whatsapp/actions/whatsapp-page.actions';
import { whatsappApiActions } from '@/app/core/store/whatsapp/actions/whatsapp-api.actions';
import { whatsappActions } from '@/app/core/store/whatsapp/actions/whatsapp.actions';

const getTime = (date: string) => new Date(date).getTime();

export const whatsappEntityAdapter: EntityAdapter<WhatsappMessage> =
  createEntityAdapter<WhatsappMessage>({
    selectId: (whatsapp: WhatsappMessage) => whatsapp.conversationId,
    sortComparer: (a: WhatsappMessage, b: WhatsappMessage) => {
      return getTime(b?.endSession) - getTime(a?.endSession);
    }
  });

const initialState: WhatsappReducerState =
  whatsappEntityAdapter.getInitialState({
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

export const whatsappReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(whatsappPageActions.nextPage, (state) => {
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

  on(whatsappPageActions.prevPage, (state) => {
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

  on(whatsappPageActions.exitPage, (state) =>
    whatsappEntityAdapter.removeAll(state)
  ),

  on(whatsappPageActions.payloadChange, (state, { payload }) => {
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
    whatsappApiActions.getWhatsappSuccess,
    (state, { messages, total, currentPage, payload }) => {
      const newState = whatsappEntityAdapter.setAll(messages, state);
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

  on(whatsappApiActions.getNewPageSuccess, (state, { messages }) => {
    return whatsappEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(whatsappApiActions.getWhatsappFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(whatsappActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }

    return whatsappEntityAdapter.setAll(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(whatsappActions.setAll, (state, { messages }) => {
    return whatsappEntityAdapter.setAll(messages, state);
  })
  // #endregion
);
