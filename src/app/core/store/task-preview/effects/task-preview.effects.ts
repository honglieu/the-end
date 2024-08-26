import { TrudiIndexedDBStorageKey } from '@core';
import { TrudiIndexedDBIndexKey } from '@core';
import { ITaskPreviewPayload } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { PreviewConversation } from '@shared/types/conversation.interface';
import {
  ITaskPreview,
  ITaskPreviewCalender
} from '@shared/types/task.interface';
import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Subject, combineLatest, lastValueFrom, of } from 'rxjs';
import {
  catchError,
  map,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import { ConversationMemoryCacheService } from '@core/store/conversation';
import { taskPreviewApiActions } from '@core/store/task-preview/actions/task-preview-api.actions';
import { taskPreviewActions } from '@core/store/task-preview/actions/task-preview.actions';
import { selectTaskPreviewData } from '@core/store/task-preview/selectors/task-preview.selectors';
import { CalendarEventMemoryCacheService } from '@core/store/task-preview/services/calendar-event-memory-cache.service';
import { TaskPreviewMemoryCacheService } from '@core/store/task-preview/services/task-preview-memory-cache.service';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { TaskPreviewApiService } from '@/app/dashboard/modules/task-page/modules/task-preview/services/task-preview-api.service';

@Injectable()
export class TaskPreviewEffects extends TrudiEffect {
  private hasInitiated = false;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(taskPreviewActions.payloadChange),
      switchMap(({ payload }) => {
        const serverData$ = new Subject<void>();

        this.handleGetCacheTaskPreview(serverData$, payload);

        return this.taskPreviewApiService.getDataTaskPreview(payload).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((response) => this.handleCacheTaskPreview(payload, response)),
          map((response) =>
            taskPreviewApiActions.getTaskPreviewSuccess({
              taskPreview: response,
              payload: payload
            })
          ),
          tap(() => (this.hasInitiated = true)),
          catchError((error) =>
            of(taskPreviewApiActions.getTaskPreviewFailure({ error }))
          )
        );
      })
    )
  );

  readonly onSetAllTaskPreview$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(taskPreviewActions.setTaskPreview),
        concatLatestFrom(() => this.store.select(selectTaskPreviewData)),
        tap(([{ taskPreview }, selectorData]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleLowPriorityTask(() => {
            this.updateDataPreviewIntoIndexedDB(taskPreview);
          });
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly taskPreviewApiService: TaskPreviewApiService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone,
    private readonly taskPreviewMemoryCacheService: TaskPreviewMemoryCacheService,
    private readonly conversationMemoryCacheService: ConversationMemoryCacheService,
    private readonly calendarEventMemoryCacheService: CalendarEventMemoryCacheService
  ) {
    super();
  }

  private handleCacheTaskPreview(
    payload: ITaskPreviewPayload,
    task: ITaskPreview
  ) {
    this.scheduleLowPriorityTask(() => {
      this.updateDataPreviewIntoIndexedDB(task);
    });
  }

  private async updateDataPreviewIntoIndexedDB(res: ITaskPreview) {
    if (!res) return;
    const taskId = res.id;

    this.getCacheTaskPreview(taskId).subscribe(
      async ([existedTask, existedConvs, existedCalendarEvents]) => {
        const { conversations, calendarEvents, ...pTask } = res;

        //Upsert task detail
        if (existedTask) {
          const deleteTaskResult = await lastValueFrom(
            this.indexedDBService.bulkDelete(
              TrudiIndexedDBStorageKey.TASK_LIST,
              [taskId]
            )
          );
        }
        const updatedTask = { ...existedTask, ...pTask };
        this.indexedDBService
          .bulkAdd(TrudiIndexedDBStorageKey.TASK_LIST, [updatedTask])
          .subscribe();

        this.taskPreviewMemoryCacheService.set(taskId, updatedTask);

        //Upsert conversations
        const conversationIds = conversations?.map((c) => c.id) || [];
        const removedConversations = existedConvs.filter(
          (ec) => !conversationIds.includes(ec.id)
        );
        const updatedConversations = existedConvs.filter((ec) =>
          conversationIds.includes(ec.id)
        );

        const removedIds = removedConversations
          .concat(updatedConversations)
          .map((c) => c.id);

        if (removedIds.length) {
          const deleteConversationsResult = await lastValueFrom(
            this.indexedDBService.bulkDelete(
              TrudiIndexedDBStorageKey.CONVERSATIONS,
              [removedIds]
            )
          );
        }

        if (conversationIds.length > 0) {
          const newConversations = conversations.map((c) => ({ ...c, taskId }));
          this.indexedDBService
            .bulkAdd(TrudiIndexedDBStorageKey.CONVERSATIONS, newConversations)
            .subscribe();

          this.conversationMemoryCacheService.set(taskId, newConversations);
        }

        //Upsert calendar events
        const removedEvents = existedCalendarEvents.filter(
          (ev) => !calendarEvents.some((ce) => ce.id === ev.id)
        );
        const updatedEvents = existedCalendarEvents.filter((ev) =>
          calendarEvents.some((ce) => ce.id === ev.id)
        );
        const removedEventIds = removedEvents
          .concat(updatedEvents)
          .map((ev) => ev.id);

        if (removedEventIds.length) {
          const deleteEventsResult = await lastValueFrom(
            this.indexedDBService.bulkDelete(
              TrudiIndexedDBStorageKey.CALENDAR_EVENTS,
              [removedEventIds]
            )
          );
        }

        if (calendarEvents?.length > 0) {
          const updatedEvs = calendarEvents.map((ce) => {
            return { ...ce, eventId: ce?.calendarEvent?.id, taskId };
          });

          this.indexedDBService
            .bulkAdd(TrudiIndexedDBStorageKey.CALENDAR_EVENTS, updatedEvs)
            .subscribe();

          this.calendarEventMemoryCacheService.set(taskId, updatedEvs);
        }
      }
    );
  }

  private getCacheTaskPreview(taskId: string) {
    return combineLatest([
      this.indexedDBService.getByID<ITaskPreview>(
        TrudiIndexedDBStorageKey.TASK_LIST,
        taskId
      ),
      this.indexedDBService.getAllByIndex<PreviewConversation>(
        TrudiIndexedDBStorageKey.CONVERSATIONS,
        TrudiIndexedDBIndexKey.TASK_ID,
        IDBKeyRange.only(taskId)
      ),
      this.indexedDBService.getAllByIndex<ITaskPreviewCalender>(
        TrudiIndexedDBStorageKey.CALENDAR_EVENTS,
        TrudiIndexedDBIndexKey.TASK_ID,
        IDBKeyRange.only(taskId)
      )
    ]);
  }

  private getMemoryCacheTaskPreview(taskId: string) {
    const existedTask = this.taskPreviewMemoryCacheService.get(taskId);
    const existedConvs = this.conversationMemoryCacheService.get(taskId);
    const existedCalendarEvents =
      this.calendarEventMemoryCacheService.get(taskId);

    return {
      existedTask,
      existedConvs,
      existedCalendarEvents
    };
  }

  private handleGetCacheTaskPreview(
    serverData$: Subject<void>,
    payload: ITaskPreviewPayload
  ) {
    const { existedTask, existedConvs, existedCalendarEvents } =
      this.getMemoryCacheTaskPreview(payload.taskId);

    const handleSetCacheTaskPreview = (taskPreview: ITaskPreview) =>
      this.store.dispatch(
        taskPreviewActions.getCacheSuccess({
          taskPreview
        })
      );

    if (existedTask) {
      return handleSetCacheTaskPreview({
        ...existedTask,
        conversations: existedConvs ?? [],
        calendarEvents: existedCalendarEvents ?? []
      });
    }

    this.getCacheTaskPreview(payload.taskId)
      .pipe(
        takeUntil(serverData$),
        // if data come from server first, then cache data will be ignored
        take(1),
        tap(([existedTask, existedConvs, existedCalendarEvents]) => {
          if (!existedTask) return;

          handleSetCacheTaskPreview({
            ...existedTask,
            conversations: existedConvs,
            calendarEvents: existedCalendarEvents
          });
        }),
        catchError((error) => of(error))
      )
      .subscribe();

    return;
  }
}
