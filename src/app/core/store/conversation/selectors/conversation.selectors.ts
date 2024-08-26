import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import {
  ConversationReducerState,
  IConversationEntity
} from '@core/store/conversation/types';
import {
  conversationEntityAdapter,
  conversationMessageEntityAdapter
} from '@core/store/conversation/reducers/conversation.reducer';

export const selectConversationState =
  createFeatureSelector<ConversationReducerState>(StoreFeatureKey.CONVERSATION);

export const {
  selectIds: selectConversationIds,
  selectAll: selectAllConversations,
  selectEntities: selectConversationEntities
} = conversationEntityAdapter.getSelectors(selectConversationState);

const { selectAll: selectAllConversationMessages } =
  conversationMessageEntityAdapter.getSelectors(
    (state) => state as IConversationEntity
  );

export const selectConversationById = (id: string) =>
  createSelector(
    selectConversationEntities,
    (conversations) => conversations[id] || null
  );

export const selectCurrentConversationId = createSelector(
  selectConversationState,
  (conversationState) => conversationState.currentConversationId
);

export const selectAllConversationMessagesByConversationId = (id: string) =>
  createSelector(selectConversationById(id), (conversation) => {
    if (!conversation) {
      return [];
    }
    return selectAllConversationMessages(
      (conversation as IConversationEntity) || []
    );
  });

export const selectCurrentConversationByConversationId = (id: string) =>
  createSelector(
    selectConversationById(id),
    (conversation) => conversation?.currentConversation
  );

export const selectMessageGroupByConversationId = (id: string) =>
  createSelector(
    selectConversationById(id),
    (conversation) => conversation?.groupMessage
  );

export const selectAllConversationMessagesInternal =
  selectAllConversationMessages;
