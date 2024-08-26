import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectAllConversationMessagesByConversationId,
  selectConversationState
} from '@core/store/conversation/selectors/conversation.selectors';
import { ConversationStorage } from '@core/store/conversation/services/conversation-storage.service';
import {
  EMPTY,
  NEVER,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  skip,
  switchMap
} from 'rxjs';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  conversationActions,
  conversationPageActions
} from '@core/store/conversation/actions/conversation.actions';
import {
  ConversationReducerState,
  IConversationEntity
} from '@core/store/conversation/types';

@Injectable()
export class ConversationEffects {
  loadInitialConversation$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(conversationPageActions.loadConversationState),
        filter(({ id }) => !!id),
        concatLatestFrom(({ id }) =>
          this.store.select(selectAllConversationMessagesByConversationId(id))
        ),
        switchMap(([{ id }, conversationMessages]) => {
          if (conversationMessages.length) {
            return EMPTY;
          }
          return this.conversationStorage
            .loadConversationStateById(id)
            .pipe(catchError(() => NEVER));
        }),
        filter(
          (state: IConversationEntity | undefined) => !!state && !!state?.id
        ),
        map((state) => {
          return conversationActions.updateConversationState({
            id: state.id,
            state: state
          });
        })
      ),
    { dispatch: true }
  );

  leaveConversation$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(conversationPageActions.exitPage),
        filter(({ id }) => !!id),
        distinctUntilChanged((prev, curr) => prev.id === curr.id),
        switchMap((res) =>
          this.store
            .select(selectConversationState)
            .pipe(map((state) => ({ state, id: res.id })))
        ),
        map(({ state, id }) => {
          this.ngZone.run(() => {
            this.persistConversationState(state, id);
          });
        })
      ),
    { dispatch: false }
  );

  constructor(
    private store: Store,
    private action$: Actions,
    private conversationStorage: ConversationStorage,
    private ngZone: NgZone
  ) {
    // TODO: reduce the number of db hits
    // consider to use middleware
    this.store
      .select(selectConversationState)
      .pipe(
        skip(1),
        debounceTime(100),
        switchMap((state: ConversationReducerState) =>
          this.persistConversationState(state)
        ),
        catchError((error) => NEVER)
      )
      .subscribe();
  }

  private persistConversationState(
    state: ConversationReducerState,
    conversationId?: string
  ) {
    return this.conversationStorage.syncConversationState(
      state,
      conversationId
    );
  }
}
