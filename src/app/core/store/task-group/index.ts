import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { taskGroupReducer } from './reducers/task-group.reducers';

export { TaskGroupReducerState } from './types';
export { TaskGroupEffects } from './effects/task-group.effects';
export { TaskGroupMemoryCacheService } from './services/task-group-memory-cache.service';
export { taskGroupPageActions } from './actions/task-group-page.actions';
export * from './reducers/task-group.reducers';
export * from './selectors/task-group.selectors';

export const taskGroupFeature = createFeature({
  name: StoreFeatureKey.TASK,
  reducer: taskGroupReducer
});
