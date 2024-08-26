import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import {
  MessagesMailFolder,
  MessagesMailFolderReducerState
} from '@core/store/message-mail-folder/types';
import { createReducer, on } from '@ngrx/store';
import { messagesMailFolderPageActions } from '@core/store/message-mail-folder/actions/message-mail-folder-page.actions';
import { messagesMailFolderApiActions } from '@core/store/message-mail-folder/actions/message-mail-folder-api.actions';
import { messagesMailFolderActions } from '@core/store/message-mail-folder/actions/message-mail-folder.actions';

export const messagesMailFolderEntityAdapter: EntityAdapter<MessagesMailFolder> =
  createEntityAdapter<MessagesMailFolder>({
    selectId: (message: MessagesMailFolder) => message.id,
    sortComparer: (a: MessagesMailFolder, b: MessagesMailFolder) =>
      new Date(b?.timestamp).getTime() - new Date(a?.timestamp).getTime()
  });

const initialState: MessagesMailFolderReducerState =
  messagesMailFolderEntityAdapter.getInitialState({
    total: 0,
    fetching: false,
    fetchingMore: true,
    error: null,
    currentPage: 0,
    messages: [],
    scrollBottomIndex: null,
    scrollTopIndex: null,
    payload: {
      search: '',
      limit: 0,
      page: 0
    }
  });

export const messagesMailFolderReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(messagesMailFolderPageActions.nextPage, (state) => {
    const newPage = Number(state.scrollBottomIndex ?? null) + 1;
    const messageTotal = Object.keys(state.messages).length;
    if (messageTotal >= state.total) {
      return state;
    }

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
  on(messagesMailFolderPageActions.prevPage, (state) => {
    const currentPage = Number(state.scrollTopIndex ?? null);
    if (currentPage === 0 && state.payload?.page === 0) {
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
  on(messagesMailFolderPageActions.pageChange, (state, { pageIndex }) => {
    const payload = {
      ...state.payload,
      currentTaskId: null,
      page: pageIndex
    };
    return {
      ...state,
      payload,
      fetching: false,
      fetchingMore: true
    };
  }),
  on(messagesMailFolderPageActions.exitPage, (state) =>
    messagesMailFolderEntityAdapter.removeAll(state)
  ),
  on(messagesMailFolderPageActions.payloadChange, (state, { payload }) => {
    // initial or has search/filter

    if (payload.page === 0) {
      return {
        ...state,
        payload,
        scrollBottomIndex: payload.page,
        scrollTopIndex: payload.page,
        fetching: true,
        error: false
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
  on(
    messagesMailFolderApiActions.getMessagesMailFolderSuccess,
    (state, { messages, currentPage, res }) => {
      const newState = messagesMailFolderEntityAdapter.setAll(messages, state);
      return {
        ...newState,
        messages,
        res,
        fetching: false,
        fetchingMore: false,
        total: Number(res.total ?? state.total),
        scrollBottomIndex: currentPage ?? state.scrollBottomIndex,
        scrollTopIndex: currentPage ?? state.scrollTopIndex,
        payload: {
          ...state.payload,
          page: currentPage ?? state.payload.page
        }
      };
    }
  ),
  on(
    messagesMailFolderActions.getCacheSuccess,
    (state, { messages, total, res }) => {
      if (!messages?.length) {
        return state;
      }
      return messagesMailFolderEntityAdapter.setAll(messages, {
        ...state,
        messages,
        res,
        fetching: false,
        total: total ?? state.total,
        payload: {
          ...state.payload,
          page: 0
        }
      });
    }
  ),
  on(messagesMailFolderPageActions.exitPage, (_state) => initialState),
  on(messagesMailFolderActions.setAll, (state, { messages }) => {
    return messagesMailFolderEntityAdapter.setAll(messages, state);
  }),
  on(
    messagesMailFolderApiActions.getMessagesMailFolderFailure,
    (state, { error }) => {
      // handle error
      const res = {
        ...state.res,
        error: error,
        messages: []
      };
      return { ...state, res, fetching: false };
    }
  ),
  on(messagesMailFolderApiActions.getNewPageSuccess, (state, { messages }) => {
    return messagesMailFolderEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  })
);
