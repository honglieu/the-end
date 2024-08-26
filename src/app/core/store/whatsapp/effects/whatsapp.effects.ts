import { TrudiIndexedDBStorageKey } from '@core/storage';
import { TaskItem } from '@shared/types/task.interface';
import { Injectable } from '@angular/core';
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
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { whatsappPageActions } from '@/app/core/store/whatsapp/actions/whatsapp-page.actions';
import { whatsappApiActions } from '@/app/core/store/whatsapp/actions/whatsapp-api.actions';
import {
  WhatsappMessage,
  IWhatsappQueryParams
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { WhatsappApiService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-api.service';
import { WhatsappMemoryCacheService } from '@/app/core/store/whatsapp/services/whatsapp-memory-cache.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { whatsappActions } from '@/app/core/store/whatsapp/actions/whatsapp.actions';
import { selectMessagePayload } from '@/app/core/store/whatsapp/selectors/whatsapp.selectors';

@Injectable()
export class WhatsappEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(whatsappPageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        } else {
          this.whatsappService.suspenseTrigger$.next(true);
        }

        return this.whatsappApiService.getWhatsappMessage(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            whatsappApiActions.getWhatsappSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) =>
            of(whatsappApiActions.getWhatsappFailure({ error }))
          )
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(whatsappActions.setAll),
        concatLatestFrom(() => this.store.select(selectMessagePayload)),
        tap(([{ messages }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleLowPriorityTask(() => {
            this.whatsappMemoryCacheService.set(
              `${payload.status}-${payload.channelId}-${payload.type}`,
              messages
            );
            this.syncStateAndLocalData(
              messages,
              payload as IWhatsappQueryParams
            );
          });
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(whatsappPageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.whatsappApiService
          .getWhatsappMessage(payload as IWhatsappQueryParams)
          .pipe(
            map((response) =>
              whatsappApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(whatsappApiActions.getWhatsappFailure({ error }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(whatsappPageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.whatsappApiService
          .getWhatsappMessage(payload as IWhatsappQueryParams)
          .pipe(
            map((response) =>
              whatsappApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(whatsappApiActions.getWhatsappFailure({ error }))
            )
          );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly whatsappApiService: WhatsappApiService,
    private readonly whatsappMemoryCacheService: WhatsappMemoryCacheService,
    private readonly whatsappService: WhatsappService
  ) {
    super();
  }

  private handleCacheMessage(response: {
    payload: IWhatsappQueryParams;
    tasks: WhatsappMessage[];
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheMessages(response?.payload)) {
        this.whatsappMemoryCacheService.set(
          `${response.payload.status}-${response.payload.channelId}-${response.payload.type}`,
          response.tasks
        );
        this.syncServerAndLocalData(response.tasks, response.payload);
      }
    });
  }

  private shouldCacheMessages(payload: IWhatsappQueryParams) {
    if (!payload) return false;
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    if (payload.assignedTo?.length) return false;
    if (payload.propertyManagerId?.length) return false;
    if (payload.messageStatus?.length) return false;
    return true;
  }

  private getCacheMessage(payload: IWhatsappQueryParams) {
    const { mailBoxId, status, type } = payload;
    return this.indexedDBService
      .getAllByIndex<WhatsappMessage>(
        TrudiIndexedDBStorageKey.WHATSAPP,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => []));
  }

  private async syncServerAndLocalData(
    newMessages: WhatsappMessage[],
    payload: IWhatsappQueryParams
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
            TrudiIndexedDBStorageKey.WHATSAPP,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.WHATSAPP,
            newMessages
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async syncStateAndLocalData(
    currentMessages: WhatsappMessage[],
    payload: IWhatsappQueryParams
  ) {
    try {
      const compareToken = `${payload.mailBoxId}-${payload.status}-${payload.type}`;
      const cachedMessages = await lastValueFrom(this.getCacheMessage(payload));

      const whatsappMap: Record<string, WhatsappMessage> =
        currentMessages.reduce((map, whatsapp) => {
          map[whatsapp.conversationId] = whatsapp;
          return map;
        }, {});

      const deletedMessageIds = [];
      for (const cacheMessage of cachedMessages) {
        const { mailBoxId, status, type } = cacheMessage;
        if (`${mailBoxId}-${status}-${type}` === compareToken) {
          if (whatsappMap[cacheMessage.conversationId]) {
            this.indexedDBService
              .update(
                TrudiIndexedDBStorageKey.WHATSAPP,
                whatsappMap[cacheMessage.conversationId]
              )
              .subscribe();
          } else {
            deletedMessageIds.push(cacheMessage.conversationId);
          }
        }
      }

      if (deletedMessageIds.length) {
        // Delete whatsapps that do not exist in the current state
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.WHATSAPP,
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
    payload: IWhatsappQueryParams
  ) {
    const memoryCache = this.whatsappMemoryCacheService.get(
      `${payload.status}-${payload.channelId}-${payload.type}`
    );

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(whatsappActions.getCacheSuccess({ messages }));

    if (memoryCache) {
      return handleSetCacheMessages(memoryCache);
    } else {
      this.whatsappService.suspenseTrigger$.next(true);
    }

    this.getCacheMessage(payload)
      .pipe(
        first(),
        // if data come from server first, then cache data will be ignored
        takeUntil(serverData$),
        tap((whatsapps) => {
          handleSetCacheMessages(whatsapps);
        })
      )
      .subscribe();

    return;
  }
}
