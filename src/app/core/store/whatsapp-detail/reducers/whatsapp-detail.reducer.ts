import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  WhatsappDetailReducerState,
  WhatsappMessage
} from '@/app/core/store/whatsapp-detail/types';
import { whatsappDetailApiActions } from '@/app/core/store/whatsapp-detail/actions/whatsapp-detail-api.actions';

export const whatsappEntityAdapter: EntityAdapter<WhatsappMessage> =
  createEntityAdapter<WhatsappMessage>({
    selectId: (whatsapp: WhatsappMessage) => whatsapp.conversationId
  });

const initialState: WhatsappDetailReducerState =
  whatsappEntityAdapter.getInitialState({
    fetching: false,
    error: null,
    task: null,
    messages: [],
    currentTaskId: null,
    currentConversationId: null
  });

export const whatsappDetailReducer = createReducer(
  initialState,
  on(
    whatsappDetailApiActions.setCurrentWhatsappDetail,
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

  on(whatsappDetailApiActions.updateWhatsappMessages, (state, { messages }) => {
    return {
      ...state,
      messages
    };
  }),

  on(whatsappDetailApiActions.updateWhatsappTask, (state, { task }) => {
    return {
      ...state,
      task
    };
  }),

  on(whatsappDetailApiActions.exitTaskDetail, () => initialState),

  on(whatsappDetailApiActions.getDetailSuccess, (state, { task, messages }) => {
    const newState = {
      ...state,
      task,
      messages,
      fetching: false
    };
    return newState;
  }),

  on(
    whatsappDetailApiActions.getCacheDetailSuccess,
    (state, { task, messages }) => {
      const newState = {
        ...state,
        task,
        messages
      };
      return newState;
    }
  ),

  on(whatsappDetailApiActions.getCacheTaskDetailSuccess, (state, { task }) => {
    const newState = {
      ...state,
      task
    };
    return newState;
  }),

  on(
    whatsappDetailApiActions.getCacheMessagesSuccess,
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

  on(whatsappDetailApiActions.getTaskFailure, (state, { error }) => {
    return {
      ...state,
      error
    };
  })
);
