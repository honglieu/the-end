import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { taskFolderReducer } from './reducers/task-folder.reducer';

export { taskFolderPageActions } from './actions/task-folder-page.actions';
export * from './reducers/task-folder.reducer';
export * from './selectors/task-folder.selectors';
export { TaskFolderMemoryCacheService } from './services/task-folder.service';
export { TaskFolderReducerState } from './types';

export const taskFolderFeature = createFeature({
  name: StoreFeatureKey.TASK_FOLDER,
  reducer: taskFolderReducer
});
