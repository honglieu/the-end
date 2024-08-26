import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { messageApiActions } from '@core/store/message/actions/message-api.actions';
import { messagePageActions } from '@core/store/message/actions/message-page.actions';
import { Message, MessageReducerState } from '@core/store/message/types';
import { messageActions } from '@core/store/message/actions/message.actions';

export const messageEntityAdapter: EntityAdapter<Message> =
  createEntityAdapter<Message>({
    selectId: (message: Message) => message.conversationId,
    sortComparer: (a: Message, b: Message) =>
      new Date(b?.conversations?.[0]?.messageDate).getTime() -
      new Date(a?.conversations?.[0]?.messageDate).getTime()
  });

const initialState: MessageReducerState = messageEntityAdapter.getInitialState({
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

export const messageReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(messagePageActions.nextPage, (state) => {
    const newPage = Number(state.scrollBottomIndex ?? null) + 1;
    const messageTotal = Object.keys(state.entities).length;
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
  on(messagePageActions.prevPage, (state) => {
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
  on(messagePageActions.enterPage, (state) => {
    return {
      ...state,
      fetching: true
    };
  }),
  on(messagePageActions.exitPage, (state) =>
    messageEntityAdapter.removeAll(state)
  ),
  on(messagePageActions.payloadChange, (state, { payload }) => {
    // initial or has search/filter
    if (payload.page === 0) {
      return {
        ...state,
        payload,
        scrollTopIndex: payload.page,
        scrollBottomIndex: payload.page,
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
  // #endregion

  // #endregion Message API Actions
  on(
    messageApiActions.getMessageSuccess,
    (state, { messages, total, currentPage }) => {
      const newState = messageEntityAdapter.setAll(messages, state);
      return {
        ...newState,
        fetching: false,
        fetchingMore: false,
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
  on(messageApiActions.getNewPageSuccess, (state, { messages }) => {
    return messageEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),
  on(messageApiActions.getMessageFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(messageActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }
    return messageEntityAdapter.setAll(messages, { ...state, fetching: false });
  }),
  on(messageActions.setAll, (state, { messages }) => {
    return messageEntityAdapter.setAll(messages, state);
  })
  // #endregion
);
