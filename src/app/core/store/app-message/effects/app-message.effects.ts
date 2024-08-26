import { TrudiIndexedDBStorageKey } from '@core';
import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import {
  catchError,
  first,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { appMessageApiActions } from '@core/store/app-message/actions/app-message-api.actions';
import { appMessagePageActions } from '@core/store/app-message/actions/app-message-page.actions';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { Store } from '@ngrx/store';
import { selectMessagePayload } from '@core/store/app-message/selectors/message.selectors';
import { Subject, lastValueFrom, of } from 'rxjs';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { Message } from '@core/store/message/types';
import { AppMessageApiService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-api.service';
import { AppMessageMemoryCacheService } from '@core/store/app-message/services/app-message-memory-cache.service';
import { TaskItem } from '@shared/types/task.interface';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import * as Sentry from '@sentry/angular-ivy';
@Injectable()
export class AppMessageEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(appMessagePageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        }

        return this.appMessageApiService.getAppMessages(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            appMessageApiActions.getAppMessageSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) => {
            Sentry.captureException(error);
            return of(
              appMessageApiActions.getAppMessageFailure({ error: true })
            );
          })
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(appMessageActions.setAll),
        concatLatestFrom(() => this.store.select(selectMessagePayload)),
        tap(([{ messages }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleLowPriorityTask(() => {
            this.syncStateAndLocalData(
              messages,
              payload as IMessageQueryParams
            );
          });
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(appMessagePageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.appMessageApiService
          .getAppMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              appMessageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(appMessageApiActions.getAppMessageFailure({ error: true }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(appMessagePageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.appMessageApiService
          .getAppMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              appMessageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(appMessageApiActions.getAppMessageFailure({ error: true }))
            )
          );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly appMessageApiService: AppMessageApiService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone,
    private readonly appMessageMemoryCacheService: AppMessageMemoryCacheService
  ) {
    super();
  }

  private handleCacheMessage(response: {
    payload: IMessageQueryParams;
    tasks: Message[];
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheMessages(response?.payload)) {
        this.syncServerAndMemoryCache(response.tasks, response.payload);
        this.syncServerAndLocalData(response.tasks, response.payload);
      }
    });
  }

  private shouldCacheMessages(payload: IMessageQueryParams) {
    if (!payload) return false;
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    if (payload.propertyId?.length) return false;
    if (payload.assignedTo?.length) return false;
    if (payload.propertyManagerId?.length) return false;
    if (payload.messageStatus?.length) return false;
    if (payload.taskDeliveryFailIds?.length) return false;
    if (payload.currentTaskId?.length) return false;
    return true;
  }

  private getCacheMessage(payload: IMessageQueryParams) {
    const { mailBoxId, status, type } = payload;
    return this.indexedDBService
      .getAllByIndex<Message>(
        TrudiIndexedDBStorageKey.APP_MESSAGE,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => []));
  }

  private syncServerAndMemoryCache(
    tasks: Message[],
    payload: IMessageQueryParams
  ) {
    const { mailBoxId, status, type } = payload;

    const token = `${mailBoxId}-${status}-${type}`;
    this.appMessageMemoryCacheService.set(token, tasks);
  }

  private async syncServerAndLocalData(
    newMessages: Message[],
    payload: IMessageQueryParams
  ) {
    try {
      const compareToken = `${payload.mailBoxId}-${payload.status}-${payload.type}`;

      const cachedMessages = await lastValueFrom(this.getCacheMessage(payload));

      const cachedToBeUpdated = [];
      const deletedMessageIds = [];

      for (const cacheMessage of cachedMessages) {
        const { mailBoxId, status, type } = cacheMessage;
        if (`${mailBoxId}-${status}-${type}` === compareToken) {
          cachedToBeUpdated.push(cacheMessage);
          deletedMessageIds.push(cacheMessage.conversationId);
        }
      }

      if (deletedMessageIds.length) {
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.APP_MESSAGE,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.APP_MESSAGE,
            newMessages
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async syncStateAndLocalData(
    currentMessages: Message[],
    payload: IMessageQueryParams
  ) {
    try {
      const compareToken = `${payload.mailBoxId}-${payload.status}-${payload.type}`;
      const cachedMessages = await lastValueFrom(this.getCacheMessage(payload));

      const messageMap: Record<string, Message> = currentMessages.reduce(
        (map, message) => {
          map[message.conversationId] = message;
          return map;
        },
        {}
      );

      const deletedMessageIds = [];
      for (const cacheMessage of cachedMessages) {
        const { mailBoxId, status, type } = cacheMessage;
        if (`${mailBoxId}-${status}-${type}` === compareToken) {
          if (messageMap[cacheMessage.conversationId]) {
            this.indexedDBService
              .update(
                TrudiIndexedDBStorageKey.APP_MESSAGE,
                messageMap[cacheMessage.conversationId]
              )
              .subscribe();
          } else {
            deletedMessageIds.push(cacheMessage.conversationId);
          }
        }
      }

      if (deletedMessageIds.length) {
        // Delete messages that do not exist in the current state
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.APP_MESSAGE,
            deletedMessageIds
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private getMemoryCacheMessage(payload: IMessageQueryParams) {
    const { mailBoxId, status, type } = payload;

    const token = `${mailBoxId}-${status}-${type}`;

    return this.appMessageMemoryCacheService.get(token);
  }

  private handleGetCacheMessages(
    serverData$: Subject<void>,
    payload: IMessageQueryParams
  ) {
    const cachedMessages = this.getMemoryCacheMessage(payload);

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(appMessageActions.getCacheSuccess({ messages }));

    if (cachedMessages) {
      return handleSetCacheMessages(cachedMessages);
    }

    this.getCacheMessage(payload)
      .pipe(
        first(),
        // if data come from server first, then cache data will be ignored
        takeUntil(serverData$),
        tap((messages) => {
          if (!messages.length) return;

          handleSetCacheMessages(messages);
        })
      )
      .subscribe();

    return;
  }
}
