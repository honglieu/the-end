import { createFeature } from '@ngrx/store';
import { taskDetailReducer } from './reducers/task-detail.reducer';
import { StoreFeatureKey } from '@core/store/feature.enum';

export { TaskDetailState } from './types';
export { taskDetailActions } from './actions/task-detail.actions';
export { taskDetailReducer } from './reducers/task-detail.reducer';
export { TaskWorkflowMemoryCacheService as TaskDetailMemoryCacheService } from './services/task-workflow-memory-cache.service';
export { TaskConversationMemoryCacheService } from './services/conversation-memory-cache.service';
export * from './selectors/task-detail.selectors';

export const taskDetailFeature = createFeature({
  name: StoreFeatureKey.TASK_DETAIL,
  reducer: taskDetailReducer
});
