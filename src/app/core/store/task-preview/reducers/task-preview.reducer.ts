import { createReducer, on } from '@ngrx/store';
import { taskPreviewApiActions } from '@core/store/task-preview/actions/task-preview-api.actions';
import { taskPreviewActions } from '@core/store/task-preview/actions/task-preview.actions';
import { TaskPreviewReducerState } from '@core/store/task-preview/types';

const initialState: TaskPreviewReducerState = {
  taskPreview: null,
  payload: null,
  error: null,
  fetching: false
};

export const taskPreviewReducer = createReducer(
  initialState,
  on(taskPreviewActions.payloadChange, (state, { payload }) => {
    const newTaskId = payload?.taskId;
    const currentTaskId = state.payload?.taskId;

    const hasChangeTask =
      Boolean(newTaskId && currentTaskId) && newTaskId !== currentTaskId;
    return {
      ...state,
      payload,
      fetching: hasChangeTask
    };
  }),

  on(
    taskPreviewApiActions.getTaskPreviewSuccess,
    (state, { taskPreview, payload }) => {
      return { ...state, taskPreview, payload, fetching: false };
    }
  ),
  on(taskPreviewApiActions.getTaskPreviewFailure, (state, { error }) => {
    // handle error
    return { ...state, error };
  }),
  on(taskPreviewActions.setTaskPreview, (state, { taskPreview }) => {
    if (!taskPreview) {
      return { taskPreview: null, payload: null, error: null, fetching: false };
    }
    return { ...state, taskPreview: { ...state.taskPreview, ...taskPreview } };
  }),
  on(taskPreviewActions.getCacheSuccess, (state, { taskPreview }) => {
    return { ...state, taskPreview, fetching: false };
  })
);
