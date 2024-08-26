import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { taskFolderEntityAdapter } from '@core/store/taskFolder/reducers/task-folder.reducer';
import { TaskFolderReducerState } from '@core/store/taskFolder/types';

export const selectTaskFolderState =
  createFeatureSelector<TaskFolderReducerState>(StoreFeatureKey.TASK_FOLDER);

export const {
  selectIds: selectTaskFolderIds,
  selectAll: selectAllTaskFolder,
  selectEntities: selectTaskFolderEntities
} = taskFolderEntityAdapter.getSelectors(selectTaskFolderState);

export const selectFetchingTaskFolder = createSelector(
  selectTaskFolderState,
  (taskFolderState) => taskFolderState.fetching
);

export const selectTaskFolderPayload = createSelector(
  selectTaskFolderState,
  (taskFolderState) => taskFolderState.payload
);
