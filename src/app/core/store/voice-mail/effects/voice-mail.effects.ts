import { TrudiIndexedDBStorageKey } from '@core/storage';
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
import { voiceMailApiActions } from '@core/store/voice-mail/actions/voice-mail-api.actions';
import { voiceMailPageActions } from '@core/store/voice-mail/actions/voice-mail-page.actions';
import { voiceMailActions } from '@core/store/voice-mail/actions/voice-mail.actions';
import { selectMessagePayload } from '@core/store/voice-mail/selectors/voice-mail.selectors';
import { VoiceMailMemoryCacheService } from '@core/store/voice-mail/services/voice-mail-memory-cache.service';
import { VoiceMailMessage } from '@core/store/voice-mail/types';
import { VoiceMailApiService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-api.service';
import { IVoiceMailQueryParams } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import * as Sentry from '@sentry/angular-ivy';

@Injectable()
export class VoiceMailEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(voiceMailPageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        if (this.shouldCacheMessages(payload)) {
          this.handleGetCacheMessages(serverData$, payload);
        } else {
          this.voiceMailService.suspenseTrigger$.next(true);
        }

        return this.voiceMailApiService.getVoiceMailMessage(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheMessage(response)),
          map((response) =>
            voiceMailApiActions.getVoiceMailSuccess({
              messages: response.tasks,
              total: response.totalTask,
              payload: response.payload,
              currentPage: response.currentPage
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) => {
            Sentry.captureException(error);
            return of(voiceMailApiActions.getVoiceMailFailure({ error: true }));
          })
        );
      })
    )
  );

  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(voiceMailActions.setAll),
        concatLatestFrom(() => this.store.select(selectMessagePayload)),
        tap(([{ messages }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleLowPriorityTask(() => {
            this.syncStateAndLocalData(
              messages,
              payload as IVoiceMailQueryParams
            );
          });
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(voiceMailPageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.voiceMailApiService
          .getVoiceMailMessage(payload as IVoiceMailQueryParams)
          .pipe(
            map((response) =>
              voiceMailApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(voiceMailApiActions.getVoiceMailFailure({ error: true }))
            )
          );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(voiceMailPageActions.prevPage),
      concatLatestFrom(() => this.store.select(selectMessagePayload)),
      switchMap(([_, payload]) => {
        return this.voiceMailApiService
          .getVoiceMailMessage(payload as IVoiceMailQueryParams)
          .pipe(
            map((response) =>
              voiceMailApiActions.getNewPageSuccess({
                messages: response.tasks,
                total: response.totalTask,
                payload: response.payload
              })
            ),
            catchError(() =>
              of(voiceMailApiActions.getVoiceMailFailure({ error: true }))
            )
          );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone,
    private readonly voiceMailApiService: VoiceMailApiService,
    private readonly voiceMailMemoryCacheService: VoiceMailMemoryCacheService,
    private readonly voiceMailService: VoiceMailService
  ) {
    super();
  }

  private handleCacheMessage(response: {
    payload: IVoiceMailQueryParams;
    tasks: VoiceMailMessage[];
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheMessages(response?.payload)) {
        this.voiceMailMemoryCacheService.set(
          response.payload.status,
          response.tasks
        );

        this.syncServerAndLocalData(response.tasks, response.payload);
      }
    });
  }

  private shouldCacheMessages(payload: IVoiceMailQueryParams) {
    if (!payload) return false;
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    if (payload.assignedTo?.length) return false;
    if (payload.propertyManagerId?.length) return false;
    if (payload.messageStatus?.length) return false;
    return true;
  }

  private getCacheMessage(payload: IVoiceMailQueryParams) {
    const { mailBoxId, status, type } = payload;
    return this.indexedDBService
      .getAllByIndex<VoiceMailMessage>(
        TrudiIndexedDBStorageKey.VOICE_MAIL,
        'mailBoxId, type, status',
        IDBKeyRange.only([mailBoxId, type, status])
      )
      .pipe(catchError(() => []));
  }

  private async syncServerAndLocalData(
    newMessages: VoiceMailMessage[],
    payload: IVoiceMailQueryParams
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
            TrudiIndexedDBStorageKey.VOICE_MAIL,
            deletedMessageIds
          )
        );
      }

      if (newMessages.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.VOICE_MAIL,
            newMessages
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async syncStateAndLocalData(
    currentMessages: VoiceMailMessage[],
    payload: IVoiceMailQueryParams
  ) {
    try {
      const compareToken = `${payload.mailBoxId}-${payload.status}-${payload.type}`;
      const cachedMessages = await lastValueFrom(this.getCacheMessage(payload));

      const voiceMailMap: Record<string, VoiceMailMessage> =
        currentMessages.reduce((map, voiceMail) => {
          map[voiceMail.conversationId] = voiceMail;
          return map;
        }, {});

      const deletedMessageIds = [];
      for (const cacheMessage of cachedMessages) {
        const { mailBoxId, status, type } = cacheMessage;
        if (`${mailBoxId}-${status}-${type}` === compareToken) {
          if (voiceMailMap[cacheMessage.conversationId]) {
            this.indexedDBService
              .update(
                TrudiIndexedDBStorageKey.VOICE_MAIL,
                voiceMailMap[cacheMessage.conversationId]
              )
              .subscribe();
          } else {
            deletedMessageIds.push(cacheMessage.conversationId);
          }
        }
      }

      if (deletedMessageIds.length) {
        // Delete voiceMails that do not exist in the current state
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.VOICE_MAIL,
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
    payload: IVoiceMailQueryParams
  ) {
    const memoryCache = this.voiceMailMemoryCacheService.get(payload.status);

    const handleSetCacheMessages = (messages: TaskItem[]) =>
      this.store.dispatch(voiceMailActions.getCacheSuccess({ messages }));

    if (memoryCache) {
      return handleSetCacheMessages(memoryCache);
    } else {
      this.voiceMailService.suspenseTrigger$.next(true);
    }

    this.getCacheMessage(payload)
      .pipe(
        first(),
        // if data come from server first, then cache data will be ignored
        takeUntil(serverData$),
        tap((voiceMails) => {
          handleSetCacheMessages(voiceMails);
        })
      )
      .subscribe();

    return;
  }
}
