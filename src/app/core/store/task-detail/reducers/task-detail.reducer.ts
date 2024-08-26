import { createReducer, on } from '@ngrx/store';
import { TaskDetailState } from '@core/store/task-detail/types';
import { taskDetailActions } from '@core/store/task-detail/actions/task-detail.actions';
import { TaskItem } from '@shared/types/task.interface';

export const initialState: TaskDetailState = {
  data: null,
  currentTaskId: null,
  currentConversationId: null,
  workflow: null,
  conversations: []
};

export const taskDetailReducer = createReducer(
  initialState,
  on(taskDetailActions.setCurrentTaskId, (state, { taskId }) => {
    const isChangeTaskId = state.currentTaskId !== taskId;
    return {
      ...(isChangeTaskId ? initialState : state),
      currentTaskId: taskId
    };
  }),
  on(
    taskDetailActions.setCurrentConversationId,
    (state, { conversationId }) => {
      return {
        ...state,
        currentConversationId: conversationId
      };
    }
  ),
  on(taskDetailActions.exitTaskDetail, () => initialState),
  on(taskDetailActions.getTaskDetailSuccess, (state, { taskDetail }) => {
    const newState = {
      ...state,
      data: taskDetail
    };
    return newState;
  }),
  on(taskDetailActions.getCacheTaskDetailSuccess, (state, { taskDetail }) => {
    const newState = {
      ...state,
      data: taskDetail
    };
    return newState;
  }),
  on(taskDetailActions.updateTaskDetail, (state, { taskDetail }) => {
    return { ...state, data: taskDetail };
  }),
  on(taskDetailActions.updateWorkflow, (state, { trudiResponse }) => {
    return {
      ...state,
      data: {
        ...(state.data ?? {}),
        trudiResponse
      } as TaskItem
    };
  }),
  on(
    taskDetailActions.getCacheConversationSuccess,
    (state, { conversations }) => {
      if (!conversations?.length) {
        return state;
      }
      return {
        ...state,
        conversations
      };
    }
  ),
  on(taskDetailActions.updateConversations, (state, { conversations }) => {
    return {
      ...state,
      conversations
    };
  })
);
