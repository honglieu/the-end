import { TrudiIndexedDBStorageKey } from '@core/storage';
import { Injectable } from '@angular/core';
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
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { Store } from '@ngrx/store';
import { Subject, lastValueFrom, of } from 'rxjs';
import { Message } from '@core/store/message/types';
import { TaskItem } from '@shared/types/task.interface';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { SmsMessageApiService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms.message.api.services';
import { SmsMessageMemoryCacheService } from '@/app/core/store/sms-message/services/sms-message-memory-cache.services';
import { smsMessagePageActions } from '@/app/core/store/sms-message/actions/sms-message-page.actions';
import { smsMessageApiActions } from '@/app/core/store/sms-message/actions/sms-message.api.actions';
import { smsMessageActions } from '@/app/core/store/sms-message/actions/sms-message.actions';
import { selectMessagePayload } from '@/app/core/store/sms-message/selectors/sms-message.selectors';

@Injectable()
export class SmsMessageEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(smsMessagePageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();
        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        }

        return this.smsMessageApiService.getAppMessages(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            smsMessageApiActions.getSmsMessageSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) =>
            of(smsMessageApiActions.getSmsMessageFailure({ error }))
          )
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(smsMessageActions.setAll),
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
      ofType(smsMessagePageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.smsMessageApiService
          .getAppMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              smsMessageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(smsMessageApiActions.getSmsMessageFailure({ error }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(smsMessagePageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.smsMessageApiService
          .getAppMessages(payload as IMessageQueryParams)
          .pipe(
            map((response) =>
              smsMessageApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(smsMessageApiActions.getSmsMessageFailure({ error }))
            )
          );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly smsMessageApiService: SmsMessageApiService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly smsMessageMemoryCacheService: SmsMessageMemoryCacheService
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
        TrudiIndexedDBStorageKey.SMS,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => of([])));
  }

  private syncServerAndMemoryCache(
    tasks: Message[],
    payload: IMessageQueryParams
  ) {
    const { mailBoxId, status, type } = payload;

    const token = `${mailBoxId}-${status}-${type}`;
    this.smsMessageMemoryCacheService.set(token, tasks);
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
            TrudiIndexedDBStorageKey.SMS,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.SMS,
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
                TrudiIndexedDBStorageKey.SMS,
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
            TrudiIndexedDBStorageKey.SMS,
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

    return this.smsMessageMemoryCacheService.get(token);
  }

  private handleGetCacheMessages(
    serverData$: Subject<void>,
    payload: IMessageQueryParams
  ) {
    const cachedMessages = this.getMemoryCacheMessage(payload);

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(smsMessageActions.getCacheSuccess({ messages }));

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
