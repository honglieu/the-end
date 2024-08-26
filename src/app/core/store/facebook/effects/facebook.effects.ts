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
import { facebookPageActions } from '@/app/core/store/facebook/actions/facebook-page.actions';
import { facebookApiActions } from '@/app/core/store/facebook/actions/facebook-api.actions';
import {
  FacebookMessage,
  IFacebookQueryParams
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { FacebookApiService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook-api.service';
import { FacebookMemoryCacheService } from '@/app/core/store/facebook/services/facebook-memory-cache.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { facebookActions } from '@/app/core/store/facebook/actions/facebook.actions';
import { selectMessagePayload } from '@/app/core/store/facebook/selectors/facebook.selectors';

@Injectable()
export class FacebookEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(facebookPageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        } else {
          this.facebookService.suspenseTrigger$.next(true);
        }

        return this.facebookApiService.getFacebookMessage(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            facebookApiActions.getFacebookSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) =>
            of(facebookApiActions.getFacebookFailure({ error }))
          )
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(facebookActions.setAll),
        concatLatestFrom(() => this.store.select(selectMessagePayload)),
        tap(([{ messages }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleLowPriorityTask(() => {
            this.facebookMemoryCacheService.set(
              `${payload.status}-${payload.channelId}-${payload.type}`,
              messages
            );
            this.syncStateAndLocalData(
              messages,
              payload as IFacebookQueryParams
            );
          });
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(facebookPageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.facebookApiService
          .getFacebookMessage(payload as IFacebookQueryParams)
          .pipe(
            map((response) =>
              facebookApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(facebookApiActions.getFacebookFailure({ error }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(facebookPageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.facebookApiService
          .getFacebookMessage(payload as IFacebookQueryParams)
          .pipe(
            map((response) =>
              facebookApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError((error) =>
              of(facebookApiActions.getFacebookFailure({ error }))
            )
          );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly facebookApiService: FacebookApiService,
    private readonly facebookMemoryCacheService: FacebookMemoryCacheService,
    private readonly facebookService: FacebookService
  ) {
    super();
  }

  private handleCacheMessage(response: {
    payload: IFacebookQueryParams;
    tasks: FacebookMessage[];
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheMessages(response?.payload)) {
        this.facebookMemoryCacheService.set(
          `${response.payload.status}-${response.payload.channelId}-${response.payload.type}`,
          response.tasks
        );

        this.syncServerAndLocalData(response.tasks, response.payload);
      }
    });
  }

  private shouldCacheMessages(payload: IFacebookQueryParams) {
    if (!payload) return false;
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    if (payload.assignedTo?.length) return false;
    if (payload.propertyManagerId?.length) return false;
    if (payload.messageStatus?.length) return false;
    return true;
  }

  private getCacheMessage(payload: IFacebookQueryParams) {
    const { mailBoxId, status, type } = payload;
    return this.indexedDBService
      .getAllByIndex<FacebookMessage>(
        TrudiIndexedDBStorageKey.FACEBOOK,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => []));
  }

  private async syncServerAndLocalData(
    newMessages: FacebookMessage[],
    payload: IFacebookQueryParams
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
            TrudiIndexedDBStorageKey.FACEBOOK,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.FACEBOOK,
            newMessages
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async syncStateAndLocalData(
    currentMessages: FacebookMessage[],
    payload: IFacebookQueryParams
  ) {
    try {
      const compareToken = `${payload.mailBoxId}-${payload.status}-${payload.type}`;
      const cachedMessages = await lastValueFrom(this.getCacheMessage(payload));

      const facebookMap: Record<string, FacebookMessage> =
        currentMessages.reduce((map, facebook) => {
          map[facebook.conversationId] = facebook;
          return map;
        }, {});

      const deletedMessageIds = [];
      for (const cacheMessage of cachedMessages) {
        const { mailBoxId, status, type } = cacheMessage;
        if (`${mailBoxId}-${status}-${type}` === compareToken) {
          if (facebookMap[cacheMessage.conversationId]) {
            this.indexedDBService
              .update(
                TrudiIndexedDBStorageKey.FACEBOOK,
                facebookMap[cacheMessage.conversationId]
              )
              .subscribe();
          } else {
            deletedMessageIds.push(cacheMessage.conversationId);
          }
        }
      }

      if (deletedMessageIds.length) {
        // Delete facebooks that do not exist in the current state
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.FACEBOOK,
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
    payload: IFacebookQueryParams
  ) {
    const memoryCache = this.facebookMemoryCacheService.get(
      `${payload.status}-${payload.channelId}-${payload.type}`
    );

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(facebookActions.getCacheSuccess({ messages }));

    if (memoryCache) {
      return handleSetCacheMessages(memoryCache);
    } else {
      this.facebookService.suspenseTrigger$.next(true);
    }

    this.getCacheMessage(payload)
      .pipe(
        first(),
        // if data come from server first, then cache data will be ignored
        takeUntil(serverData$),
        tap((facebooks) => {
          handleSetCacheMessages(facebooks);
        })
      )
      .subscribe();

    return;
  }
}
