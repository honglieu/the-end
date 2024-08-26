import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskDetailState } from '@core/store/task-detail/types';
import { StoreFeatureKey } from '@core/store/feature.enum';

export const selectTaskDetailState = createFeatureSelector<TaskDetailState>(
  StoreFeatureKey.TASK_DETAIL
);

export const selectTaskDetailTrudiResponse = createSelector(
  selectTaskDetailState,
  (state) => state.data?.trudiResponse
);

export const selectCurrentTaskId = createSelector(
  selectTaskDetailState,
  (state) => state.currentTaskId
);

export const selectCurrentConversationId = createSelector(
  selectTaskDetailState,
  (state) => state.currentConversationId
);

export const selectAllConversation = createSelector(
  selectTaskDetailState,
  (state) => state.conversations
);

export const selectTaskDetailData = createSelector(
  selectTaskDetailState,
  (state) => state.data
);
