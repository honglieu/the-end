import { TrudiIndexedDBStorageKey } from '@core';
import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { ConversationReducerState } from '@core/store/conversation/types';
import { NEVER } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConversationStorage {
  constructor(private indexDBService: NgxIndexedDBService) {}

  syncConversationState(
    state: ConversationReducerState,
    conversationId?: string
  ) {
    if (!state || (!state.currentConversationId && !conversationId))
      return NEVER;
    const entity =
      state.entities[state.currentConversationId || conversationId];
    if (!entity) return NEVER;
    return this.indexDBService.update(
      TrudiIndexedDBStorageKey.CONVERSATION,
      entity
    );
  }

  loadConversationStateById(id: string) {
    return this.indexDBService.getByKey(
      TrudiIndexedDBStorageKey.CONVERSATION,
      id
    );
  }
}
