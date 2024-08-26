import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import {
  MailFolder,
  MailFolderReducerState
} from '@core/store/mail-folder/types';
import { createReducer, on } from '@ngrx/store';
import { mailFolderPageActions } from '@core/store/mail-folder/actions/mail-folder-page.actions';
import { mailFolderApiActions } from '@core/store/mail-folder/actions/mail-folder-api.actions';
import { mailFolderActions } from '@core/store/mail-folder/actions/mail-folder.actions';

export const mailFolderEntityAdapter: EntityAdapter<MailFolder> =
  createEntityAdapter<MailFolder>({
    selectId: (mailFolder: MailFolder) => mailFolder?.internalId
  });

const initialState: MailFolderReducerState =
  mailFolderEntityAdapter.getInitialState({
    fetching: false,
    error: null,
    payload: {}
  });

export const mailFolderReducer = createReducer(
  initialState,
  on(mailFolderPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(mailFolderApiActions.getMailFolderSuccess, (state, { mailFolders }) => {
    const newState = mailFolderEntityAdapter.setAll(mailFolders, state);
    return {
      ...newState,
      fetching: false
    };
  }),
  on(mailFolderApiActions.getMailFolderFailure, (state, { error }) => {
    return { ...state, error, fetching: false };
  }),
  on(mailFolderActions.setAllMailFolderToCache, (state, { mailFolders }) => {
    return mailFolderEntityAdapter.setAll(mailFolders, state);
  }),
  on(mailFolderActions.getCacheSuccess, (state, { mailFolders }) => {
    return mailFolderEntityAdapter.setAll(mailFolders, {
      ...state,
      fetching: false
    });
  })
);
