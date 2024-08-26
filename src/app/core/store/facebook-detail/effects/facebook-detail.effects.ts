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
import { FacebookDetailTaskMemoryCacheService } from '@/app/core/store/facebook-detail/services/facebook-detail-task-memory-cache.service';
import { FacebookDetailMessagesMemoryCacheService } from '@/app/core/store/facebook-detail/services/facebook-detail-messages-memory-cache.service';
import { facebookDetailApiActions } from '@/app/core/store/facebook-detail/actions/facebook-detail-api.actions';
import { FacebookApiService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook-api.service';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { isValidMessageForMarkerNewForYou } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';

@Injectable()
export class FacebookDetailEffects extends TrudiEffect {
  private readonly serverData$ = new Subject<void>();
  private readonly onExitPage$ = new Subject<void>();
  private cancelRequest$ = new Subject<void>();

  readonly currentTaskId$ = createEffect(() =>
    this.action$.pipe(
      ofType(facebookDetailApiActions.setCurrentFacebookDetail),
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

  readonly updateFacebookTask$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(facebookDetailApiActions.updateFacebookTask),
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
              this.facebookApiService.getMessengerHistory(
                conversationId,
                false,
                initialMessages[initialMessages.length - 1]?.createdAt || null,
                null,
                false
              )
            ).pipe(
              map((nextResponse) => {
                if (!!nextResponse.list.length) {
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
      map((res) => facebookDetailApiActions.getDetailSuccess(res)),
      tap(({ task, messages }) => {
        this.handleCacheTaskDetail(taskId, task);
        this.handleCacheMessages(taskId, messages);
      }),
      catchError((error) =>
        of(facebookDetailApiActions.getTaskFailure({ error }))
      )
    );
  }

  private getMessengerHistoryRecursively(
    conversationId: string,
    accumulatedMessages: IFacebookMessage[]
  ): Observable<IFacebookMessage[]> {
    // Logic used for skipping marker NEW FOR YOU showing above messages that are not text or file
    const after = accumulatedMessages.length
      ? accumulatedMessages[0].createdAt
      : null;
    return this.makeApiCall(
      this.facebookApiService.getMessengerHistory(
        conversationId,
        true,
        null,
        after,
        !!after
      )
    ).pipe(
      switchMap((response) => {
        const messages = response.list as IFacebookMessage[];
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
    private readonly facebookDetailTaskMemoryCacheService: FacebookDetailTaskMemoryCacheService,
    private readonly facebookDetailConversationMemoryCacheService: FacebookDetailMessagesMemoryCacheService,
    private readonly taskApiService: TaskApiService,
    private readonly facebookApiService: FacebookApiService
  ) {
    super();
  }

  private getCacheDetail(taskId: string) {
    const cacheServices = [
      {
        cache: this.facebookDetailTaskMemoryCacheService.get(taskId),
        fetchFn: () => this.getTaskDetailToIndexedDB(taskId)
      },
      {
        cache: this.facebookDetailConversationMemoryCacheService.get(taskId),
        fetchFn: () => this.getMessagesToIndexedDB(taskId)
      }
    ];

    // Check if all cache data is available
    const allCached = cacheServices.every((service) => service.cache);
    let messagesCache = cacheServices[1].cache as IFacebookMessage[];
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
        facebookDetailApiActions.getCacheDetailSuccess({
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
            facebookDetailApiActions.getCacheTaskDetailSuccess({
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
    this.facebookDetailTaskMemoryCacheService.set(taskId, taskDetail);
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
      .getByKey<{ taskId: string; messages: IFacebookMessage[] }>(
        TrudiIndexedDBStorageKey.TASK_CONVERSATIONS,
        taskId
      )
      .pipe(takeUntil(this.serverData$))
      .subscribe({
        next: (response) => {
          if (!response?.messages) return;
          console.debug('got indexedDB messages:', response?.messages);
          const messages = response?.messages;
          facebookDetailApiActions.getCacheMessagesSuccess({
            messages
          });
        },
        error: (error) => {
          console.error('get messages error:', error);
        }
      });
  }

  private handleCacheMessages(taskId: string, messages: IFacebookMessage[]) {
    this.facebookDetailConversationMemoryCacheService.set(taskId, messages);
    this.scheduleLowPriorityTask(() => {
      this.saveMessagesToIndexedDB(taskId, messages);
    });
  }

  private saveMessagesToIndexedDB(
    taskId: string,
    messages: IFacebookMessage[]
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
