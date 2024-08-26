import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  switchMap,
  Subject,
  tap,
  map,
  catchError,
  of,
  lastValueFrom,
  takeUntil,
  take,
  concatMap
} from 'rxjs';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import {
  IEmailQueryParams,
  IMessagesResponse
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { messagesMailFolderApiActions } from '@core/store/message-mail-folder/actions/message-mail-folder-api.actions';
import { messagesMailFolderPageActions } from '@core/store/message-mail-folder/actions/message-mail-folder-page.actions';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { MessagesMailFolder } from '@core/store/message-mail-folder/types';
import { TrudiIndexedDBStorageKey } from '@core';
import { TrudiIndexedDBIndexKey } from '@core';
import { messagesMailFolderActions } from '@core/store/message-mail-folder/actions/message-mail-folder.actions';
import {
  selectMessagePayload,
  selectMessagesResponseState,
  selectMessagesState
} from '@core/store/message-mail-folder/selectors/message-mail-folder.selectors';
import { MessagesMailFolderMemoryCacheService } from '@core/store/message-mail-folder/services/message-mail-folder-memory-cache.service';
import { TrudiEffect } from '@core/store/shared/trudi-effect';

@Injectable()
export class MessagesMailFolderEffects extends TrudiEffect {
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagesMailFolderPageActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        if (this.shouldCacheMessages(payload)) {
          const handleGetCacheSuccess = (cache: MessagesMailFolder[]) => {
            return this.store.dispatch(
              messagesMailFolderActions.getCacheSuccess({
                messages: this.mapMessages(cache, payload),
                payload: payload,
                res: this.formatMessagesToRes(cache, payload)
              })
            );
          };
          const memoryCache = this.messagesMailFolderMemoryCacheService.get(
            `${payload.mailBoxId}-${payload.externalId}`
          );

          if (memoryCache) {
            handleGetCacheSuccess(memoryCache);
          } else {
            const cacheData$ = this.getCacheMessages(payload).pipe(
              // if data come from server first, then cache data will be ignored
              takeUntil(serverData$),
              take(1),
              tap((messages) => {
                handleGetCacheSuccess(messages);
              }),
              catchError((error) => of(error))
            );
            cacheData$.subscribe();
          }
          return this.getListMessageMailbox(payload).pipe(
            tap(() => {
              serverData$.next();
              serverData$.complete();
            })
          );
        }

        return this.getListMessageMailbox(payload);
      })
    )
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagesMailFolderPageActions.nextPage),
      concatLatestFrom(() => [
        this.store.select(selectMessagePayload),
        this.store.select(selectMessagesState)
      ]),
      concatMap(([_, payload, currentData]) => {
        const mappedPayload = {
          ...payload,
          currentMailMessageId: null,
          page: payload.page
        } as IEmailQueryParams;
        const serverData$ = this.getListMessageMailboxApi(mappedPayload);

        return serverData$.pipe(
          map((response) => {
            const mapData = {
              ...response,
              messages: response.messages.concat(currentData)
            };
            // NOTE: handle data is duplicated when user was scrolling up/down
            return messagesMailFolderApiActions.getNewPageSuccess({
              messages: this.mapMessages(mapData.messages, mappedPayload),
              payload: mappedPayload,
              currentPage: mapData.currentPage
            });
          })
        );
      })
    )
  );

  readonly prevPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagesMailFolderPageActions.prevPage),
      concatLatestFrom(() => [
        this.store.select(selectMessagePayload),
        this.store.select(selectMessagesState)
      ]),
      concatMap(([_, payload, currentData]) => {
        const mappedPayload = {
          ...payload,
          currentMailMessageId: null,
          page: payload.page
        } as IEmailQueryParams;
        const serverData$ = this.getListMessageMailboxApi(mappedPayload);

        return serverData$.pipe(
          map((response) => {
            const mapData = {
              ...response,
              messages: response.messages.concat(currentData)
            };
            // NOTE: handle data is duplicated when user was scrolling up/down
            return messagesMailFolderApiActions.getNewPageSuccess({
              messages: this.mapMessages(mapData.messages, mappedPayload),
              payload: mappedPayload,
              currentPage: mapData.currentPage
            });
          })
        );
      })
    )
  );

  readonly pageChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(messagesMailFolderPageActions.pageChange),
      concatLatestFrom(() => [
        this.store.select(selectMessagePayload),
        this.store.select(selectMessagesState)
      ]),
      concatMap(([{ pageIndex }, payload, currentData]) => {
        const mappedPayload = {
          ...payload,
          page: Number(pageIndex)
        } as IEmailQueryParams;
        const serverData$ = this.getListMessageMailboxApi(mappedPayload);

        return serverData$.pipe(
          map((response) => {
            const mapData = {
              ...response,
              messages: response.messages.concat(currentData)
            };
            // NOTE: handle data is duplicated when user was scrolling up/down
            return messagesMailFolderApiActions.getMessagesMailFolderSuccess({
              messages: this.mapMessages(mapData.messages, mappedPayload),
              payload: mappedPayload,
              res: mapData,
              currentPage: mapData.currentPage
            });
          })
        );
      })
    )
  );

  readonly setAll$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(messagesMailFolderActions.setAll),
        concatLatestFrom(() => [
          this.store.select(selectMessagePayload),
          this.store.select(selectMessagesResponseState)
        ]),
        tap(([{ messages }, payload, currentData]) => {
          const messagesRes = this.formatMessagesToRes(
            messages,
            payload as IEmailQueryParams
          );
          this.handleCacheMessage(payload as IEmailQueryParams, messagesRes);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly emailApiService: EmailApiService,
    private readonly messagesMailFolderMemoryCacheService: MessagesMailFolderMemoryCacheService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone
  ) {
    super();
  }

  private shouldCacheMessages(payload: IEmailQueryParams) {
    if (!payload) return false;
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    return true;
  }

  private getListMessageMailboxApi(payload: IEmailQueryParams) {
    return this.emailApiService.getListMessageApi(payload);
  }

  private setDataToInMem(
    payload: IEmailQueryParams,
    data: MessagesMailFolder[]
  ) {
    if (this.shouldCacheMessages(payload)) {
      this.messagesMailFolderMemoryCacheService.set(
        `${payload.mailBoxId}-${payload.externalId}`,
        data
      );
    }
  }

  private getListMessageMailbox(payload) {
    return this.getListMessageMailboxApi(payload).pipe(
      catchError((error) => of(null)),
      tap((response) => response && this.handleCacheMessage(payload, response)),
      map((response) => {
        if (!response) {
          return messagesMailFolderApiActions.getMessagesMailFolderFailure({
            error: 'error'
          });
        }
        this.setDataToInMem(payload, response.messages);
        return messagesMailFolderApiActions.getMessagesMailFolderSuccess({
          messages: this.mapMessages(response.messages, payload),
          payload: payload,
          res: response,
          currentPage: response.currentPage
        });
      })
    );
  }

  private handleCacheMessage(
    payload: IEmailQueryParams,
    messages: IMessagesResponse
  ) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheMessages(payload)) {
        this.updateDataIntoIndexedDB(messages, payload);
      }
    });
  }

  private async updateDataIntoIndexedDB(
    res: IMessagesResponse,
    payload: IEmailQueryParams
  ) {
    const { mailBoxId, externalId } = payload;
    const { messages } = res;
    const cachedMessages = await lastValueFrom(this.getCacheMessages(payload));
    const compareToken = `${mailBoxId}-${externalId}`;
    const cachedMessagesToBeUpdated = [];
    const deletedMessagesIds = [];
    const updatedDataMessages = messages.map((item) => {
      const _existed = cachedMessages.find((x) => x.id === item.id);
      return {
        ..._existed,
        ...item,
        externalId
      };
    });
    for (const cachedMessage of cachedMessages) {
      if (
        `${cachedMessage.mailBoxId}-${cachedMessage.externalId}` ===
        compareToken
      ) {
        cachedMessagesToBeUpdated.push(cachedMessage);
        deletedMessagesIds.push(cachedMessage.id);
      }
    }
    if (deletedMessagesIds.length) {
      const deleteResult = await lastValueFrom(
        this.indexedDBService.bulkDelete(
          TrudiIndexedDBStorageKey.MESSAGE_MAIL_FOLDER,
          deletedMessagesIds
        )
      );
      console.debug('delete messages mail folder result', deleteResult);
    }
    if (updatedDataMessages) {
      const addResult = await lastValueFrom(
        this.indexedDBService.bulkAdd(
          TrudiIndexedDBStorageKey.MESSAGE_MAIL_FOLDER,
          updatedDataMessages
        )
      );
      console.debug('add messages mail folder result', addResult);
    }
  }

  getCacheMessages(payload: IEmailQueryParams) {
    const { mailBoxId, externalId } = payload;
    return this.indexedDBService
      .getAllByIndex<MessagesMailFolder>(
        TrudiIndexedDBStorageKey.MESSAGE_MAIL_FOLDER,
        `${TrudiIndexedDBIndexKey.MAIL_BOX_ID}, ${TrudiIndexedDBIndexKey.EXTERNAL_ID}`,
        IDBKeyRange.only([mailBoxId, externalId])
      )
      .pipe(
        catchError((err) => {
          return [];
        })
      );
  }

  private mapMessages(
    messages: MessagesMailFolder[],
    payload: IEmailQueryParams
  ) {
    const { externalId } = payload;
    return messages
      .map((message) => {
        return {
          ...message,
          externalId
        };
      })
      .sort(
        (a, b) =>
          new Date(b?.timestamp).getTime() - new Date(a?.timestamp).getTime()
      );
  }

  private formatMessagesToRes(
    messages: MessagesMailFolder[],
    payload: IEmailQueryParams
  ): IMessagesResponse {
    return {
      messages: this.mapMessages(messages, payload),
      currentPage: 0
    };
  }
}
