import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { conversationReducer } from './reducers/conversation.reducer';

export * from './reducers/conversation.reducer';
export * from './selectors/conversation.selectors';
export { ConversationMemoryCacheService } from './services/conversation-memory-cache.service';
export { ConversationReducerState } from './types';

export const conversationFeature = createFeature({
  name: StoreFeatureKey.CONVERSATION,
  reducer: conversationReducer
});
