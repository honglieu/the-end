import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { mailFolderReducer } from './reducers/mail-folder.reducer';

export { mailFolderPageActions } from './actions/mail-folder-page.actions';
export * from './reducers/mail-folder.reducer';
export * from './selectors/mail-folder.selectors';
export { MailFolderMemoryCacheService } from './services/mail-folder.service';
export { MailFolderReducerState } from './types';

export const mailFolderFeature = createFeature({
  name: StoreFeatureKey.TASK_FOLDER,
  reducer: mailFolderReducer
});
