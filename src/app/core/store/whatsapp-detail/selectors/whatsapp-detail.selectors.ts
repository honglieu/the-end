import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { whatsappEntityAdapter } from '@/app/core/store/whatsapp-detail/reducers/whatsapp-detail.reducer';
import { WhatsappDetailReducerState } from '@/app/core/store/whatsapp-detail/types';

export const selectWhatsappDetailState =
  createFeatureSelector<WhatsappDetailReducerState>(
    StoreFeatureKey.WHATSAPP_DETAIL
  );

export const { selectIds: selectMessageIds } =
  whatsappEntityAdapter.getSelectors(selectWhatsappDetailState);

export const selectCurrentTaskId = createSelector(
  selectWhatsappDetailState,
  (state) => state.currentTaskId
);

export const selectCurrentConversationId = createSelector(
  selectWhatsappDetailState,
  (state) => state.currentConversationId
);

export const selectTask = createSelector(
  selectWhatsappDetailState,
  (state) => state.task
);

export const selectMessages = createSelector(
  selectWhatsappDetailState,
  (state) => state.messages
);

export const selectFetching = createSelector(
  selectWhatsappDetailState,
  (state) => state.fetching
);
