import { TrudiIndexedDBStorageKey } from '@core/storage';
import { TaskItem } from '@shared/types/task.interface';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { WhatsappDetailTaskMemoryCacheService } from '@/app/core/store/whatsapp-detail/services/whatsapp-detail-task-memory-cache.service';
import { WhatsappDetailMessagesMemoryCacheService } from '@/app/core/store/whatsapp-detail/services/whatsapp-detail-messages-memory-cache.service';
import { whatsappDetailApiActions } from '@/app/core/store/whatsapp-detail/actions/whatsapp-detail-api.actions';
import { WhatsappApiService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-api.service';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { isValidMessageForMarkerNewForYou } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/utils/function';

@Injectable()
export class WhatsappDetailEffects extends TrudiEffect {
  private readonly serverData$ = new Subject<void>();
  private readonly onExitPage$ = new Subject<void>();
  private cancelRequest$ = new Subject<void>();

  readonly currentTaskId$ = createEffect(() =>
    this.action$.pipe(
      ofType(whatsappDetailApiActions.setCurrentWhatsappDetail),
      switchMap(({ taskId, conversationId }) => {
        if (!taskId || !conversationId) {
          return EMPTY;
        }
        this.cancelRequest$.next();
        this.getCacheDetail(taskId);
        return this.getDetailApi(taskId, conversationId).pipe(
          tap(() => this.serverData$.next())
        );
      })
    )
  );

  readonly updateWhatsappTask$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(whatsappDetailApiActions.updateWhatsappTask),
        tap(({ task }) => {
          this.handleCacheTaskDetail(task.id, task);
        })
      ),
    { dispatch: false }
  );

  private makeApiCall<T>(observable: Observable<T>) {
    return observable.pipe(takeUntil(this.cancelRequest$));
  }

  private getDetailApi(taskId: string, conversationId: string) {
    return forkJoin({
      task: this.makeApiCall(this.taskApiService.getTaskById(taskId)),
      messages: this.getMessengerHistoryRecursively(conversationId, []).pipe(
        switchMap((response) => {
          const initialMessages = response;
          if (initialMessages.length < 20) {
            return this.makeApiCall(
              this.whatsappApiService.getMessageHistory(
                conversationId,
                false,
                initialMessages[initialMessages.length - 1]?.createdAt || null,
                null,
                false
              )
            ).pipe(
              map((nextResponse) => {
                if (nextResponse.list.length) {
                  const allMessages = initialMessages.concat(nextResponse.list);
                  return allMessages;
                }
                return initialMessages;
              })
            );
          }
          return of(initialMessages);
        })
      )
    }).pipe(
      takeUntil(this.onExitPage$),
      map((res) => whatsappDetailApiActions.getDetailSuccess(res)),
      tap(({ task, messages }) => {
        this.handleCacheTaskDetail(taskId, task);
        this.handleCacheMessages(taskId, messages);
      }),
      catchError((error) =>
        of(whatsappDetailApiActions.getTaskFailure({ error }))
      )
    );
  }

  private getMessengerHistoryRecursively(
    conversationId: string,
    accumulatedMessages: IWhatsappMessage[]
  ): Observable<IWhatsappMessage[]> {
    // Logic used for skipping marker NEW FOR YOU showing above messages that are not text or file
    const after = accumulatedMessages.length
      ? accumulatedMessages[0].createdAt
      : null;
    return this.makeApiCall(
      this.whatsappApiService.getMessageHistory(
        conversationId,
        true,
        null,
        after,
        !!after
      )
    ).pipe(
      switchMap((response) => {
        const messages = response.list as IWhatsappMessage[];
        const allMessages = [...messages, ...accumulatedMessages];
        const lastReadMessageIndex = allMessages.findIndex(
          (msg) => msg.isLastReadMessage
        );
        if (lastReadMessageIndex === -1) {
          return of(allMessages);
        }
        let found = false;
        const moreRecentIndex = lastReadMessageIndex - 1;
        if (
          moreRecentIndex >= 0 &&
          isValidMessageForMarkerNewForYou(allMessages[moreRecentIndex])
        ) {
          return of(allMessages);
        }
        for (let i = lastReadMessageIndex; i >= 0; i--) {
          if (
            isValidMessageForMarkerNewForYou(allMessages[i]) &&
            i < lastReadMessageIndex
          ) {
            allMessages[lastReadMessageIndex].isLastReadMessage = false;
            allMessages[i + 1].isLastReadMessage = true;
            found = true;
            return of(allMessages);
          }
        }
        if (!response.list.length && !found) {
          allMessages.forEach((msg) => (msg.isLastReadMessage = false));
          return of(allMessages);
        }
        return this.getMessengerHistoryRecursively(conversationId, allMessages);
      })
    );
  }

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly whatsappDetailTaskMemoryCacheService: WhatsappDetailTaskMemoryCacheService,
    private readonly whatsappDetailConversationMemoryCacheService: WhatsappDetailMessagesMemoryCacheService,
    private readonly taskApiService: TaskApiService,
    private readonly whatsappApiService: WhatsappApiService
  ) {
    super();
  }

  private getCacheDetail(taskId: string) {
    const cacheServices = [
      {
        cache: this.whatsappDetailTaskMemoryCacheService.get(taskId),
        fetchFn: () => this.getTaskDetailToIndexedDB(taskId)
      },
      {
        cache: this.whatsappDetailConversationMemoryCacheService.get(taskId),
        fetchFn: () => this.getMessagesToIndexedDB(taskId)
      }
    ];

    // Check if all cache data is available
    const allCached = cacheServices.every((service) => service.cache);
    let messagesCache = cacheServices[1].cache as IWhatsappMessage[];
    if (messagesCache?.length) {
      if (messagesCache.some((msg) => msg.isLastReadMessage)) {
        messagesCache = messagesCache.map((msg) => ({
          ...msg,
          isLastReadMessage: false
        }));
      }
    }
    if (allCached) {
      return this.store.dispatch(
        whatsappDetailApiActions.getCacheDetailSuccess({
          task: cacheServices[0].cache as TaskItem,
          messages: messagesCache
        })
      );
    }

    // Trigger fetching of missing data
    cacheServices.forEach((service) => {
      if (!service.cache) {
        service.fetchFn();
      }
    });
  }

  private getTaskDetailToIndexedDB(taskId: string) {
    return this.indexedDBService
      .getByKey<TaskItem>(TrudiIndexedDBStorageKey.TASK_DETAIL, taskId)
      .pipe(takeUntil(this.serverData$))
      .subscribe({
        next: (taskDetail) => {
          if (!taskDetail) return;
          console.debug('got indexedDB task detail:', taskDetail);
          this.store.dispatch(
            whatsappDetailApiActions.getCacheTaskDetailSuccess({
              task: taskDetail
            })
          );
        },
        error: (error) => {
          console.error('get task detail error:', error);
        }
      });
  }

  private handleCacheTaskDetail(taskId: string, taskDetail: TaskItem) {
    this.whatsappDetailTaskMemoryCacheService.set(taskId, taskDetail);
    this.scheduleLowPriorityTask(() => {
      this.saveTaskDetailToIndexedDB(taskDetail);
    });
  }

  private saveTaskDetailToIndexedDB(taskDetail: TaskItem) {
    this.indexedDBService
      .update(TrudiIndexedDBStorageKey.TASK_DETAIL, taskDetail)
      .subscribe({
        next: (value) => {
          console.debug('save task detail to indexedDB success:', value);
        },
        error: (error) => {
          console.error('save task detail to indexedDB error:', error);
        }
      });
  }

  // Handle conversations in task detail
  private getMessagesToIndexedDB(taskId: string) {
    return this.indexedDBService
      .getByKey<{ taskId: string; messages: IWhatsappMessage[] }>(
        TrudiIndexedDBStorageKey.TASK_CONVERSATIONS,
        taskId
      )
      .pipe(takeUntil(this.serverData$))
      .subscribe({
        next: (response) => {
          if (!response?.messages) return;
          console.debug('got indexedDB messages:', response?.messages);
          const messages = response?.messages;
          whatsappDetailApiActions.getCacheMessagesSuccess({
            messages
          });
        },
        error: (error) => {
          console.error('get messages error:', error);
        }
      });
  }

  private handleCacheMessages(taskId: string, messages: IWhatsappMessage[]) {
    this.whatsappDetailConversationMemoryCacheService.set(taskId, messages);
    this.scheduleLowPriorityTask(() => {
      this.saveMessagesToIndexedDB(taskId, messages);
    });
  }

  private saveMessagesToIndexedDB(
    taskId: string,
    messages: IWhatsappMessage[]
  ) {
    return this.indexedDBService
      .update(TrudiIndexedDBStorageKey.TASK_CONVERSATIONS, {
        taskId,
        messages
      })
      .subscribe({
        next: (value) => {
          console.debug('save conversations to indexedDB success:', value);
        },
        error: (error) => {
          console.error('save conversations to indexedDB error:', error);
        }
      });
  }
}
