import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MailFolderReducerState } from '@core/store/mail-folder/types';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { mailFolderEntityAdapter } from '@core/store/mail-folder/reducers/mail-folder.reducer';

export const selectMailFolderState =
  createFeatureSelector<MailFolderReducerState>(StoreFeatureKey.MAIL_FOLDER);

export const {
  selectIds: selectMailFolderIds,
  selectAll: selectAllMailFolder,
  selectEntities: selectMailFolderEntities
} = mailFolderEntityAdapter.getSelectors(selectMailFolderState);

export const selectFetchingMailFolder = createSelector(
  selectMailFolderState,
  (mailFolderState) => mailFolderState.fetching
);

export const selectMailFolderPayload = createSelector(
  selectMailFolderState,
  (mailFolderState) => mailFolderState.payload
);
