import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { voiceMailApiActions } from '@core/store/voice-mail/actions/voice-mail-api.actions';
import { voiceMailPageActions } from '@core/store/voice-mail/actions/voice-mail-page.actions';
import {
  VoiceMailMessage,
  VoiceMailReducerState
} from '@core/store/voice-mail/types';
import { voiceMailActions } from '@core/store/voice-mail/actions/voice-mail.actions';

const getTime = (date: string) => new Date(date).getTime();

export const voiceMailEntityAdapter: EntityAdapter<VoiceMailMessage> =
  createEntityAdapter<VoiceMailMessage>({
    selectId: (voiceMail: VoiceMailMessage) => voiceMail.conversationId,
    sortComparer: (a: VoiceMailMessage, b: VoiceMailMessage) => {
      return getTime(b?.endSession) - getTime(a?.endSession);
    }
  });

const initialState: VoiceMailReducerState =
  voiceMailEntityAdapter.getInitialState({
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

export const voiceMailReducer = createReducer(
  initialState,
  // #region Message Page Actions
  on(voiceMailPageActions.nextPage, (state) => {
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

  on(voiceMailPageActions.prevPage, (state) => {
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

  on(voiceMailPageActions.exitPage, (state) =>
    voiceMailEntityAdapter.removeAll(state)
  ),

  on(voiceMailPageActions.payloadChange, (state, { payload }) => {
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
    voiceMailApiActions.getVoiceMailSuccess,
    (state, { messages, total, currentPage, payload }) => {
      const newState = voiceMailEntityAdapter.setAll(messages, state);
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

  on(voiceMailApiActions.getNewPageSuccess, (state, { messages }) => {
    return voiceMailEntityAdapter.upsertMany(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(voiceMailApiActions.getVoiceMailFailure, (state, { error }) => {
    return { ...state, error, fetching: false, fetchingMore: false };
  }),
  // #endregion

  // #region Message Actions
  on(voiceMailActions.getCacheSuccess, (state, { messages }) => {
    if (!messages?.length) {
      return state;
    }

    return voiceMailEntityAdapter.setAll(messages, {
      ...state,
      fetching: false,
      fetchingMore: false
    });
  }),

  on(voiceMailActions.setAll, (state, { messages }) => {
    return voiceMailEntityAdapter.setAll(messages, state);
  })
  // #endregion
);
