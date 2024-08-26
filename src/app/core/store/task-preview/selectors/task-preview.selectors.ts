import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { TaskPreviewReducerState } from '@core/store/task-preview/types';

export const selectTaskPreviewState =
  createFeatureSelector<TaskPreviewReducerState>(StoreFeatureKey.TASK_PREVIEW);

export const selectTaskPreviewData = createSelector(
  selectTaskPreviewState,
  (taskPreviewState) => taskPreviewState.taskPreview
);

export const selectTaskPreviewPayload = createSelector(
  selectTaskPreviewState,
  (state) => state.payload
);

export const selectFetchingTaskPreview = createSelector(
  selectTaskPreviewState,
  (state) => state.fetching
);
