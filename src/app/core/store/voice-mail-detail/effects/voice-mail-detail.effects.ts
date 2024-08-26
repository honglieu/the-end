import { TrudiIndexedDBStorageKey } from '@core/storage';
import { TaskItem } from '@shared/types/task.interface';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { VoiceMailApiService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-api.service';
import { voiceMailDetailApiActions } from '@core/store/voice-mail-detail/actions/voice-mail-detail-api.actions';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { IMessage } from '@shared/types/message.interface';
import { isValidMessageForMarkerNewForYou } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/utils/function';
import { VoicemailDetailTaskMemoryCacheService } from '../services/voice-mail-detail-task-memory-cache.service';
import { VoicemailDetailMessagesMemoryCacheService } from '../services/voice-mail-detail-messages-memory-cache.service';

@Injectable()
export class VoiceMailDetailEffects extends TrudiEffect {
  private readonly serverData$ = new Subject<void>();
  private readonly onExitPage$ = new Subject<void>();
  private cancelRequest$ = new Subject<void>();

  readonly currentTaskId$ = createEffect(() =>
    this.action$.pipe(
      ofType(voiceMailDetailApiActions.setCurrentVoiceMail),
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

  private makeApiCall<T>(observable: Observable<T>) {
    return observable.pipe(takeUntil(this.cancelRequest$));
  }

  private getDetailApi(taskId, conversationId) {
    return forkJoin({
      task: this.makeApiCall(this.taskApiService.getTaskById(taskId)),
      messages: this.getVoiceMailHistoryRecursively(conversationId, []).pipe(
        switchMap((response) => {
          const initialMessages = response;
          if (initialMessages.length < 20) {
            return this.makeApiCall(
              this.voiceMailApiService.getVoiceMailHistory(
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
      map((res) => voiceMailDetailApiActions.getDetailSuccess(res)),
      tap(({ task, messages }) => {
        this.handleCacheTaskDetail(taskId, task);
        this.handleCacheMessages(taskId, messages);
      }),
      catchError((error) =>
        of(voiceMailDetailApiActions.getTaskFailure({ error }))
      )
    );
  }

  private getVoiceMailHistoryRecursively(
    conversationId: string,
    accumulatedMessages: IMessage[]
  ): Observable<IMessage[]> {
    // Logic used for skipping marker NEW FOR YOU showing above messages that are not text or file
    const after = accumulatedMessages.length
      ? accumulatedMessages[0].createdAt
      : null;
    return this.makeApiCall(
      this.voiceMailApiService.getVoiceMailHistory(
        conversationId,
        true,
        null,
        after,
        !!after
      )
    ).pipe(
      switchMap((response) => {
        const messages = response.list as IMessage[];
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
        return this.getVoiceMailHistoryRecursively(conversationId, allMessages);
      })
    );
  }

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly voiceMailApiService: VoiceMailApiService,
    private readonly voicemailDetailTaskMemoryCacheService: VoicemailDetailTaskMemoryCacheService,
    private readonly voicemailDetailMessagesMemoryCacheService: VoicemailDetailMessagesMemoryCacheService,
    private readonly taskApiService: TaskApiService
  ) {
    super();
  }

  private getCacheDetail(taskId: string) {
    const cacheServices = [
      {
        cache: this.voicemailDetailTaskMemoryCacheService.get(taskId),
        fetchFn: () => this.getTaskDetailToIndexedDB(taskId)
      },
      {
        cache: this.voicemailDetailMessagesMemoryCacheService.get(taskId),
        fetchFn: () => this.getMessagesToIndexedDB(taskId)
      }
    ];

    // Check if all cache data is available
    const allCached = cacheServices.every((service) => service.cache);

    if (allCached) {
      return this.store.dispatch(
        voiceMailDetailApiActions.getCacheDetailSuccess({
          task: cacheServices[0].cache as TaskItem,
          messages: cacheServices[1].cache as IMessage[]
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
            voiceMailDetailApiActions.getCacheTaskDetailSuccess({
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
    this.voicemailDetailTaskMemoryCacheService.set(taskId, taskDetail);
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

  // Handle messages in task detail
  private getMessagesToIndexedDB(taskId: string) {
    return this.indexedDBService
      .getByKey<{ taskId: string; messages: IMessage[] }>(
        TrudiIndexedDBStorageKey.TASK_CONVERSATIONS,
        taskId
      )
      .pipe(takeUntil(this.serverData$))
      .subscribe({
        next: (response) => {
          if (!response?.messages) return;
          console.debug('got indexedDB messages:', response?.messages);
          const messages = response?.messages ?? [];
          voiceMailDetailApiActions.getCacheMessagesSuccess({
            messages
          });
        },
        error: (error) => {
          console.error('get messages error:', error);
        }
      });
  }

  private handleCacheMessages(taskId: string, messages: IMessage[]) {
    this.voicemailDetailMessagesMemoryCacheService.set(taskId, messages);
    this.scheduleLowPriorityTask(() => {
      this.saveMessagesToIndexedDB(taskId, messages);
    });
  }

  private saveMessagesToIndexedDB(taskId: string, messages: IMessage[]) {
    return this.indexedDBService
      .update(TrudiIndexedDBStorageKey.TASK_CONVERSATIONS, {
        taskId,
        messages
      })
      .subscribe({
        next: (value) => {
          console.debug('save messages to indexedDB success:', value);
        },
        error: (error) => {
          console.error('save messages to indexedDB error:', error);
        }
      });
  }
}
