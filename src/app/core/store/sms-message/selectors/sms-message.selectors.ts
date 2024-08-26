import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { SmsMessageReducerState } from '@/app/core/store/sms-message/types';
import { smsMessageEntityAdapter } from '@/app/core/store/sms-message/reducers/sms-message.reducers';

export const selectSmsMessageState =
  createFeatureSelector<SmsMessageReducerState>(StoreFeatureKey.SMS_MESSAGE);

export const {
  selectIds: selectSmsMessageIds,
  selectAll: selectAllSmsMessage,
  selectEntities: selectSmsMessageEntities
} = smsMessageEntityAdapter.getSelectors(selectSmsMessageState);

export const selectFetchingMessage = createSelector(
  selectSmsMessageState,
  (messageState) => messageState.fetching
);

export const selectTotalMessage = createSelector(
  selectSmsMessageState,
  (messageState) => messageState.total
);

export const selectFetchingMoreMessage = createSelector(
  selectSmsMessageState,
  (messageState) => messageState.fetchingMore
);

export const selectMessagePayload = createSelector(
  selectSmsMessageState,
  (messageState) => messageState.payload
);
