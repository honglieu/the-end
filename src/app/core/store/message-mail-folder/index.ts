import { StoreFeatureKey } from '@core/store/feature.enum';
import { messagesMailFolderReducer } from './reducers/message-mail-folder.reducers';

export { messagesMailFolderPageActions } from './actions/message-mail-folder-page.actions';
export { MessagesMailFolderEffects } from './effects/message-mail-folder.effects';
export * from './reducers/message-mail-folder.reducers';
export * from './selectors/message-mail-folder.selectors';
export { MessagesMailFolderMemoryCacheService } from './services/message-mail-folder-memory-cache.service';
export { MessagesMailFolderReducerState } from './types';

export const messagesMailFolderFeature = {
  name: StoreFeatureKey.MESSAGE_MAIL_FOLDER,
  reducer: messagesMailFolderReducer
};
