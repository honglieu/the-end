import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { appMessageApiActions } from '@core/store/app-message/actions/app-message-api.actions';
import { appMessagePageActions } from '@core/store/app-message/actions/app-message-page.actions';
import { AppMessageReducerState } from '@core/store/app-message/types';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { Message } from '@core/store/message/types';
import { TaskStatusType } from '@shared/enum';

export const appMessageEntityAdapter: EntityAdapter<Message> =
  createEntityAdapter<Message>({
    selectId: (message: Message) => message.conversationId,
    sortComparer: (a: Message, b: Message) =>
      new Date(b?.conversations?.[0]?.messageDate).getTime() -
      new Date(a?.conversations?.[0]?.messageDate).getTime()
  });

const initialState: AppMessageReducerState =
  appMessageEntityAdapter.getInitialState({
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
    },
    tempMessage: null
  });

export const appMessageReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(appMessagePageActions.nextPage, (state) => {
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
  on(appMessagePageActions.prevPage, (state) => {
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
  on(appMessagePageActions.exitPage, (state) =>
    appMessageEntityAdapter.removeAll(state)
  ),
  on(appMessagePageActions.payloadChange, (state, { payload }) => {
    // initial or has search/filter
    if (payload.page === 0) {
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
    appMessageApiActions.getAppMessageSuccess,
    (state, { messages, total, currentPage }) => {
      const messagesList =
        state.tempMessage &&
        state.payload.status === TaskStatusType.inprogress &&
        !messages.some((msg) => msg.id === state.tempMessage.id)
          ? [state.tempMessage, ...messages]
          : messages;
      const newState = appMessageEntityAdapter.setAll(messagesList, state);
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
  on(appMessageApiActions.getNewPageSuccess, (state, { messages }) => {
    return appMessageEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),
  on(appMessageApiActions.getAppMessageFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(appMessageActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }
    return appMessageEntityAdapter.setAll(messages, {
      ...state,
      fetching: false
    });
  }),
  on(appMessageActions.setAll, (state, { messages }) => {
    return appMessageEntityAdapter.setAll(messages, state);
  }),
  // #endregion

  //tempMessage

  on(appMessageActions.setTempMessage, (state, message) => {
    return {
      ...state,
      tempMessage: message
    };
  }),
  on(appMessageActions.removeTempMessage, (state, { conversationId }) => {
    if (typeof conversationId !== 'string') {
      return {
        ...state,
        tempMessage: null
      };
    } else {
      const newState = appMessageEntityAdapter.removeOne(conversationId, state);
      return {
        ...newState,
        tempMessage: null
      };
    }
  }),

  on(appMessageActions.setLoadingMessage, (state, message) => {
    return appMessageEntityAdapter.upsertOne(message, {
      ...state
    });
  }),
  on(appMessageActions.removeLoadingMessage, (state, { conversationId }) => {
    const newState = appMessageEntityAdapter.removeOne(conversationId, state);
    return {
      ...newState
    };
  })
);
