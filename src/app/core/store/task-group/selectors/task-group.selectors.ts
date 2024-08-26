import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { TaskGroupReducerState } from '@core/store/task-group/types';
import { taskGroupEntityAdapter } from '@core/store/task-group/reducers/task-group.reducers';

export const selectTaskGroupsState =
  createFeatureSelector<TaskGroupReducerState>(StoreFeatureKey.TASK);

export const {
  selectIds: selectTaskGroupIds,
  selectAll: selectAllTaskGroup,
  selectEntities: selectTaskGroupEntities
} = taskGroupEntityAdapter.getSelectors(selectTaskGroupsState);

export const selectIsFromCacheTaskGroup = createSelector(
  selectTaskGroupsState,
  (taskGroupState) => taskGroupState.isFromCache
);

export const selectFetchingTaskGroup = createSelector(
  selectTaskGroupsState,
  (taskGroupState) => taskGroupState.fetching
);

export const selectTaskGroupPayload = createSelector(
  selectTaskGroupsState,
  (taskGroupState) => taskGroupState.payload.payloadProcess
);

export const selectCompletedTaskGroupPayload = createSelector(
  selectTaskGroupsState,
  (taskGroupState) => taskGroupState.payload.payloadCompleted
);

export const selectTaskGroupError = createSelector(
  selectTaskGroupsState,
  (taskGroupState) => taskGroupState.error
);
