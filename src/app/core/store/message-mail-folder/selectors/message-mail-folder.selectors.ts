import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { messagesMailFolderEntityAdapter } from '@core/store/message-mail-folder/reducers/message-mail-folder.reducers';
import { MessagesMailFolderReducerState } from '@core/store/message-mail-folder/types';

export const selectMessagesMailFolderState =
  createFeatureSelector<MessagesMailFolderReducerState>(
    StoreFeatureKey.MESSAGE_MAIL_FOLDER
  );

export const {
  selectIds: selectmessagesMailFolderIds,
  selectAll: selectAllmessagesMailFolder,
  selectEntities: selectmessagesMailFolderEntities
} = messagesMailFolderEntityAdapter.getSelectors(selectMessagesMailFolderState);

export const selectFetchingMessage = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.fetching
);

export const selectFetchingMoreMessage = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.fetchingMore
);

export const selectMessagesResponseState = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.res
);

export const selectMessagesState = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.messages
);

export const selectTotalMessage = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.total
);

export const selectMessagePayload = createSelector(
  selectMessagesMailFolderState,
  (messageState) => messageState.payload
);
