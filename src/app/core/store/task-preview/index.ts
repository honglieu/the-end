import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { taskPreviewReducer } from './reducers/task-preview.reducer';

export { taskPreviewApiActions } from './actions/task-preview-api.actions';
export { taskPreviewActions } from './actions/task-preview.actions';
export { TaskPreviewEffects } from './effects/task-preview.effects';
export * from './reducers/task-preview.reducer';
export * from './selectors/task-preview.selectors';
export { CalendarEventMemoryCacheService } from './services/calendar-event-memory-cache.service';
export { TaskPreviewMemoryCacheService } from './services/task-preview-memory-cache.service';
export { TaskPreviewReducerState } from './types';

export const taskPreviewFeature = createFeature({
  name: StoreFeatureKey.TASK_PREVIEW,
  reducer: taskPreviewReducer
});
