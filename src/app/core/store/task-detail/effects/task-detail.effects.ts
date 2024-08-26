import { Injectable } from '@angular/core';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { taskDetailActions } from '@core/store/task-detail/actions/task-detail.actions';
import { EMPTY, Subject, map, of, switchMap, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { TaskItem } from '@shared/types/task.interface';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { TrudiIndexedDBStorageKey } from '@core';
import {
  selectCurrentTaskId,
  selectTaskDetailState
} from '@core/store/task-detail/selectors/task-detail.selectors';
import { TaskConversationMemoryCacheService } from '@core/store/task-detail/services/conversation-memory-cache.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { TaskService } from '@services/task.service';
import { TaskDetailMemoryCacheService } from '@core/store/task-detail/services/task-detail-memory-cache.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';

@Injectable()
export class TaskDetailEffects extends TrudiEffect {
  private readonly serverData$ = new Subject<void>();

  readonly currentTaskId$ = createEffect(() =>
    this.actions$.pipe(
      ofType(taskDetailActions.setCurrentTaskId),
      switchMap(({ taskId }) => {
        if (!taskId) {
          return EMPTY;
        }
        this.getCacheTaskDetail(taskId);
        return this.taskService.getTaskById(taskId).pipe(
          tap(() => this.serverData$.next()),
          map((response) =>
            taskDetailActions.getTaskDetailSuccess({ taskDetail: response })
          ),
          tap(({ taskDetail }) => {
            this.handleCacheTaskDetail(taskId, taskDetail);
          })
        );
      })
    )
  );

  readonly currentTaskSteps = createEffect(() =>
    this.actions$.pipe(
      ofType(
        taskDetailActions.setCurrentTaskId,
        taskDetailActions.getListSteps
      ),
      switchMap(({ taskId }) => {
        if (!taskId) {
          return EMPTY;
        }
        return this.stepService.getAllTaskSteps(taskId).pipe(
          tap((data) => {
            this.stepService.setListTaskSteps(data);
          }),
          map((res) =>
            taskDetailActions.getListStepsSuccess({
              listSteps: res
            })
          )
        );
      })
    )
  );

  readonly updateTaskDetail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          taskDetailActions.updateTaskDetail,
          taskDetailActions.updateWorkflow
        ),
        concatLatestFrom(() => this.store.select(selectTaskDetailState)),
        tap(([_, taskDetailState]) => {
          if (taskDetailState.currentTaskId && taskDetailState.data) {
            this.handleCacheTaskDetail(
              taskDetailState.currentTaskId,
              taskDetailState.data
            );
          }
        })
      ),
    { dispatch: false }
  );

  // Handle conversations in task detail
  readonly taskIdConversations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(taskDetailActions.setCurrentTaskId),
      switchMap(({ taskId }) => {
        if (!taskId) {
          return EMPTY;
        }
        return this.handleGetCacheConversations(taskId);
      })
    )
  );

  readonly onSetAllConversations$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(taskDetailActions.updateConversations),
        concatLatestFrom(() => this.store.select(selectCurrentTaskId)),
        tap(([{ conversations, taskId }, taskIdStore]) => {
          if (!conversations?.length) return;
          this.handleCacheConversations(conversations, taskIdStore || taskId);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly conversationMemoryCacheService: TaskConversationMemoryCacheService,
    private readonly taskDetailMemoryCacheService: TaskDetailMemoryCacheService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly taskService: TaskService,
    private readonly stepService: StepService
  ) {
    super();
  }

  private getCacheTaskDetail(taskId: string) {
    const taskDetailCached = this.taskDetailMemoryCacheService.get(taskId);
    if (taskDetailCached) {
      console.debug('got memory cache task detail:', taskDetailCached);
      this.store.dispatch(
        taskDetailActions.getCacheTaskDetailSuccess({
          taskDetail: taskDetailCached
        })
      );
    } else {
      this.indexedDBService
        .getByKey<TaskItem>(TrudiIndexedDBStorageKey.TASK_DETAIL, taskId)
        .pipe(takeUntil(this.serverData$))
        .subscribe({
          next: (taskDetail) => {
            if (!taskDetail) return;
            console.debug('got indexedDB task detail:', taskDetail);
            this.store.dispatch(
              taskDetailActions.getCacheTaskDetailSuccess({
                taskDetail
              })
            );
          },
          error: (error) => {
            console.error('get task detail error:', error);
          }
        });
    }
  }

  private handleCacheTaskDetail(taskId: string, taskDetail: TaskItem) {
    this.taskDetailMemoryCacheService.set(taskId, taskDetail);
    this.scheduleLowPriorityTask(() => {
      this.saveTaskDetailToIndexedDB(taskDetail);
    });
  }

  private saveTaskDetailToIndexedDB(taskDetail: TaskItem) {
    this.indexedDBService
      .update(TrudiIndexedDBStorageKey.TASK_DETAIL, taskDetail)
      .subscribe({
        next(value) {
          console.debug('save task detail to indexedDB success:', value);
        },
        error(error) {
          console.error('save task detail to indexedDB error:', error);
        }
      });
  }

  // Handle conversations in task detail
  private handleGetCacheConversations(taskId: string) {
    const memoryCacheConversations =
      this.conversationMemoryCacheService.get(taskId);
    if (memoryCacheConversations) {
      return of(
        taskDetailActions.getCacheConversationSuccess({
          conversations: memoryCacheConversations
        })
      );
    }
    return this.indexedDBService
      .getByKey<{ taskId: string; conversations: Partial<UserConversation>[] }>(
        TrudiIndexedDBStorageKey.TASK_CONVERSATIONS,
        taskId
      )
      .pipe(
        map((response) => {
          const conversations = response?.conversations ?? [];
          return taskDetailActions.getCacheConversationSuccess({
            conversations
          });
        })
      );
  }

  private handleCacheConversations(
    conversations: Partial<UserConversation>[],
    taskId: string
  ) {
    this.conversationMemoryCacheService.set(taskId, conversations);
    this.scheduleLowPriorityTask(() => {
      return this.indexedDBService
        .update(TrudiIndexedDBStorageKey.TASK_CONVERSATIONS, {
          taskId,
          conversations
        })
        .subscribe({
          next(value) {
            console.debug('update conversations success:', value);
          },
          error(error) {
            console.error('update conversations error:', error);
          }
        });
    });
  }
}
