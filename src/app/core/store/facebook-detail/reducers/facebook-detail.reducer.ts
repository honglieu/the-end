import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FacebookDetailReducerState,
  FacebookMessage
} from '@/app/core/store/facebook-detail/types';
import { facebookDetailApiActions } from '@/app/core/store/facebook-detail/actions/facebook-detail-api.actions';

export const facebookEntityAdapter: EntityAdapter<FacebookMessage> =
  createEntityAdapter<FacebookMessage>({
    selectId: (facebook: FacebookMessage) => facebook.conversationId
  });

const initialState: FacebookDetailReducerState =
  facebookEntityAdapter.getInitialState({
    fetching: false,
    error: null,
    task: null,
    messages: [],
    currentTaskId: null,
    currentConversationId: null
  });

export const facebookDetailReducer = createReducer(
  initialState,
  on(
    facebookDetailApiActions.setCurrentFacebookDetail,
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

  on(facebookDetailApiActions.updateFacebookMessages, (state, { messages }) => {
    return {
      ...state,
      messages
    };
  }),

  on(facebookDetailApiActions.updateFacebookTask, (state, { task }) => {
    return {
      ...state,
      task
    };
  }),

  on(facebookDetailApiActions.exitTaskDetail, () => initialState),

  on(facebookDetailApiActions.getDetailSuccess, (state, { task, messages }) => {
    const newState = {
      ...state,
      task,
      messages,
      fetching: false
    };
    return newState;
  }),

  on(
    facebookDetailApiActions.getCacheDetailSuccess,
    (state, { task, messages }) => {
      const newState = {
        ...state,
        task,
        messages
      };
      return newState;
    }
  ),

  on(facebookDetailApiActions.getCacheTaskDetailSuccess, (state, { task }) => {
    const newState = {
      ...state,
      task
    };
    return newState;
  }),

  on(
    facebookDetailApiActions.getCacheMessagesSuccess,
    (state, { messages }) => {
      if (!messages.length) {
        return state;
      }
      return {
        ...state,
        messages
      };
    }
  ),

  on(facebookDetailApiActions.getTaskFailure, (state, { error }) => {
    return {
      ...state,
      error
    };
  })
);
