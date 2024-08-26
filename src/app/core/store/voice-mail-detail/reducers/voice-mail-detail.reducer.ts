import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  VoiceMailMessage,
  VoiceMailDetailReducerState
} from '@core/store/voice-mail-detail/types';
import { voiceMailDetailApiActions } from '@core/store/voice-mail-detail/actions/voice-mail-detail-api.actions';

export const voiceMailEntityAdapter: EntityAdapter<VoiceMailMessage> =
  createEntityAdapter<VoiceMailMessage>({
    selectId: (voiceMail: VoiceMailMessage) => voiceMail.conversationId
  });

const initialState: VoiceMailDetailReducerState =
  voiceMailEntityAdapter.getInitialState({
    fetching: false,
    error: null,
    task: null,
    messages: [],
    currentTaskId: null,
    currentConversationId: null
  });

export const voiceMailDetailReducer = createReducer(
  initialState,
  // #region Voice Mail Detail
  on(
    voiceMailDetailApiActions.setCurrentVoiceMail,
    (state, { taskId, conversationId }) => {
      const isChangeTaskId = state.currentTaskId !== taskId;
      return {
        ...(isChangeTaskId ? initialState : state),
        fetching: true,
        currentTaskId: taskId,
        currentConversationId: conversationId
      };
    }
  ),

  on(
    voiceMailDetailApiActions.updateVoicemailMessages,
    (state, { messages }) => {
      if (!messages?.length) {
        return state;
      }
      return {
        ...state,
        messages
      };
    }
  ),

  on(voiceMailDetailApiActions.updateVoicemailTask, (state, { task }) => {
    return {
      ...state,
      task
    };
  }),

  on(voiceMailDetailApiActions.exitTaskDetail, () => initialState),

  on(
    voiceMailDetailApiActions.getDetailSuccess,
    (state, { task, messages }) => {
      const newState = {
        ...state,
        task,
        messages,
        fetching: false
      };
      return newState;
    }
  ),

  on(
    voiceMailDetailApiActions.getCacheDetailSuccess,
    (state, { task, messages }) => {
      const newState = {
        ...state,
        task,
        messages,
        fetching: false
      };
      return newState;
    }
  ),

  on(voiceMailDetailApiActions.getCacheTaskDetailSuccess, (state, { task }) => {
    const newState = {
      ...state,
      task
    };
    return newState;
  }),

  on(
    voiceMailDetailApiActions.getCacheMessagesSuccess,
    (state, { messages }) => {
      if (!messages?.length) {
        return state;
      }
      return {
        ...state,
        messages
      };
    }
  ),

  on(voiceMailDetailApiActions.getTaskFailure, (state, { error }) => {
    return {
      ...state,
      error
    };
  })
);
