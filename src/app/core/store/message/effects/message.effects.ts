import { TrudiIndexedDBStorageKey } from '@core';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { TaskItem } from '@shared/types/task.interface';
import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Subject, lastValueFrom, of } from 'rxjs';
import {
  catchError,
  first,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { messageApiActions } from '@core/store/message/actions/message-api.actions';
import { messagePageActions } from '@core/store/message/actions/message-page.actions';
import { messageActions } from '@core/store/message/actions/message.actions';
import { MessageMemoryCacheService } from '@core/store/message/services/message-memory-cache.service';
import { Message } from '@core/store/message/types';
import {
  selectMessageEntities,
  selectMessagePayload
} from '@core/store/message/selectors/message.selectors';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SocketType, TaskStatusType, TaskType } from '@shared/enum';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import * as Sentry from '@sentry/angular-ivy';
@Injectable()
export class MessageEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagePageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();
        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        }

        return this.messageApiService.getMessages(payload).pipe(
          tap({
            complete: () => {
              serverData$.next();
              serverData$.complete();
            }
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            messageApiActions.getMessageSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) => {
            Sentry.captureException(error);
            return of(messageApiActions.getMessageFailure({ error: true }));
          })
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(messageActions.setAll),
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

  readonly remoMessage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(messageActions.removeMessage),
        tap(({ conversationId, tokenProperty }) => {
          const messages = this.getMemoryCacheMessage(tokenProperty);
          this.syncServerAndMemoryCache(
            messages.filter((msg) => msg.conversationId !== conversationId),
            tokenProperty
          );
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagePageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.messageApiService
          .getMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              messageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(messageApiActions.getMessageFailure({ error: true }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagePageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.messageApiService
          .getMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              messageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(messageApiActions.getMessageFailure({ error: true }))
            )
          );
      })
    )
  );

  readonly loadMessageRemoved$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagePageActions.loadMessageRemoved),
      concatLatestFrom(() => this.store.select(selectMessageEntities)),
      tap(([{ taskId }]) =>
        this.toastService.openToastCustom(
          {
            taskId,
            taskType: TaskType.MESSAGE,
            type: SocketType.changeStatusTask,
            status: TaskStatusType.deleted
          },
          true
        )
      ),
      map(([{ taskId }, entities]) => {
        const messages = [];
        const conversationIdsNeedToBeRemoved = [];
        for (const message of Object.values(entities)) {
          if (message.id !== taskId) {
            messages.push(message);
          } else {
            conversationIdsNeedToBeRemoved.push(message.conversationId);
          }
        }
        this.indexedDBService
          .bulkDelete(
            TrudiIndexedDBStorageKey.MESSAGE,
            conversationIdsNeedToBeRemoved
          )
          .subscribe();
        return messageActions.setAll({ messages });
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly messageApiService: MessageApiService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone,
    private readonly messageMemoryCacheService: MessageMemoryCacheService,
    private readonly toastService: ToastCustomService
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
        TrudiIndexedDBStorageKey.MESSAGE,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => []));
  }

  private getMemoryCacheMessage(
    payload: IMessageQueryParams | Partial<IMessageQueryParams>
  ) {
    const { mailBoxId, status, type } = payload;

    const token = `${mailBoxId}-${status}-${type}`;

    return this.messageMemoryCacheService.get(token);
  }

  private syncServerAndMemoryCache(
    tasks: Message[],
    payload: Partial<IMessageQueryParams>
  ) {
    const { mailBoxId, status, type } = payload;

    const token = `${mailBoxId}-${status}-${type}`;
    this.messageMemoryCacheService.set(token, tasks);
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
            TrudiIndexedDBStorageKey.MESSAGE,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.MESSAGE,
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
                TrudiIndexedDBStorageKey.MESSAGE,
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
            TrudiIndexedDBStorageKey.MESSAGE,
            deletedMessageIds
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private handleGetCacheMessages(
    serverData$: Subject<void>,
    payload: IMessageQueryParams
  ) {
    const cachedMessages = this.getMemoryCacheMessage(payload);

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(messageActions.getCacheSuccess({ messages }));

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
