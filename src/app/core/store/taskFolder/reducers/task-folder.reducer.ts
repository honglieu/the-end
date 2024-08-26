import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { taskFolderApiActions } from '@core/store/taskFolder/actions/task-folder-api.actions';
import { taskFolderPageActions } from '@core/store/taskFolder/actions/task-folder-page.actions';
import {
  TaskFolder,
  TaskFolderReducerState
} from '@core/store/taskFolder/types';
import { taskFolderActions } from '@core/store/taskFolder/actions/task-folder.actions';

export const taskFolderEntityAdapter: EntityAdapter<TaskFolder> =
  createEntityAdapter<TaskFolder>({
    selectId: (taskFolder: TaskFolder) => taskFolder.id
  });

const initialState: TaskFolderReducerState =
  taskFolderEntityAdapter.getInitialState({
    fetching: false,
    error: null,
    payload: {}
  });

export const taskFolderReducer = createReducer(
  initialState,
  on(taskFolderPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(taskFolderApiActions.getTaskFolderSuccess, (state, { taskFolders }) => {
    const newState = taskFolderEntityAdapter.setAll(taskFolders, state);
    return {
      ...newState,
      fetching: false
    };
  }),
  on(taskFolderApiActions.getTaskFolderFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(taskFolderActions.setAll, (state, { taskFolders }) => {
    return taskFolderEntityAdapter.setAll(taskFolders, state);
  }),
  on(taskFolderActions.getCacheSuccess, (state, { taskFolders }) => {
    return taskFolderEntityAdapter.setAll(taskFolders, {
      ...state,
      fetching: false
    });
  })
);
