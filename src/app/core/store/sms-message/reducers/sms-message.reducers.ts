import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Message } from '@core/store/message/types';
import { TaskStatusType } from '@shared/enum';
import { smsMessagePageActions } from '@/app/core/store/sms-message/actions/sms-message-page.actions';
import { SmsMessageReducerState } from '@/app/core/store/sms-message/types';
import { smsMessageApiActions } from '@/app/core/store/sms-message/actions/sms-message.api.actions';
import { smsMessageActions } from '@/app/core/store/sms-message/actions/sms-message.actions';

export const smsMessageEntityAdapter: EntityAdapter<Message> =
  createEntityAdapter<Message>({
    selectId: (message: Message) => message.conversationId,
    sortComparer: (a: Message, b: Message) =>
      new Date(b?.conversations?.[0]?.messageDate).getTime() -
      new Date(a?.conversations?.[0]?.messageDate).getTime()
  });

const initialState: SmsMessageReducerState =
  smsMessageEntityAdapter.getInitialState({
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

export const smsMessageReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(smsMessagePageActions.nextPage, (state) => {
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
  on(smsMessagePageActions.prevPage, (state) => {
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
  on(smsMessagePageActions.exitPage, (state) =>
    smsMessageEntityAdapter.removeAll(state)
  ),
  on(smsMessagePageActions.payloadChange, (state, { payload }) => {
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
    smsMessageApiActions.getSmsMessageSuccess,
    (state, { messages, total, currentPage }) => {
      const messagesList =
        state.tempMessage &&
        state.payload.status === TaskStatusType.inprogress &&
        !messages.some((msg) => msg.id === state.tempMessage.id)
          ? [state.tempMessage, ...messages]
          : messages;
      const newState = smsMessageEntityAdapter.setAll(messagesList, state);
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
  on(smsMessageApiActions.getNewPageSuccess, (state, { messages }) => {
    return smsMessageEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),
  on(smsMessageApiActions.getSmsMessageFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(smsMessageActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }
    return smsMessageEntityAdapter.setAll(messages, {
      ...state,
      fetching: false
    });
  }),
  on(smsMessageActions.setAll, (state, { messages }) => {
    return smsMessageEntityAdapter.setAll(messages, state);
  }),
  // #endregion

  //tempMessage

  on(smsMessageActions.setTempMessage, (state, message) => {
    return {
      ...state,
      tempMessage: message
    };
  }),
  on(smsMessageActions.removeTempMessage, (state, { conversationId }) => {
    if (typeof conversationId !== 'string') {
      return {
        ...state,
        tempMessage: null
      };
    } else {
      const newState = smsMessageEntityAdapter.removeOne(conversationId, state);
      return {
        ...newState,
        tempMessage: null
      };
    }
  }),

  on(smsMessageActions.setLoadingMessage, (state, message) => {
    return smsMessageEntityAdapter.upsertOne(message, {
      ...state
    });
  }),
  on(smsMessageActions.removeLoadingMessage, (state, { conversationId }) => {
    const newState = smsMessageEntityAdapter.removeOne(conversationId, state);
    return {
      ...newState
    };
  })
);
