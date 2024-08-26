import { TrudiIndexedDBStorageKey } from '@core';
import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { Injectable, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Subject, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { taskFolderApiActions } from '@core/store/taskFolder/actions/task-folder-api.actions';
import { taskFolderPageActions } from '@core/store/taskFolder/actions/task-folder-page.actions';
import { taskFolderActions } from '@core/store/taskFolder/actions/task-folder.actions';
import { TaskFolderMemoryCacheService } from '@core/store/taskFolder/services/task-folder.service';
import {
  TaskFolder,
  TaskFolderPayloadType
} from '@core/store/taskFolder/types';
import { TrudiEffect } from '@core/store/shared/trudi-effect';

@Injectable()
export class TaskFolderEffects extends TrudiEffect {
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(taskFolderPageActions.payloadChange),
      switchMap(({ payload }) => {
        const { companyId } = payload;
        const serverData$ = new Subject<void>();

        this.handleGetCacheTaskFolders(serverData$, companyId);

        return this.dashboardApiService.getTaskFolders(companyId).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap(({ taskFolders, payload }) => {
            this.handleCacheTaskFolder({ taskFolders, payload });
          }),
          map(({ taskFolders, payload }) => {
            return taskFolderApiActions.getTaskFolderSuccess({
              taskFolders,
              payload
            });
          })
        );
      })
    )
  );

  readonly getTaskFolder$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(taskFolderApiActions.getTaskFolderSuccess),
        tap(({ taskFolders, payload }) => {
          this.scheduleLowPriorityTask(() => {
            this.handleCacheTaskFolder({ taskFolders, payload });
          });
        }),
        map(() => EMPTY)
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly zone: NgZone,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly dashboardApiService: DashboardApiService,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly taskFolderMemoryCacheService: TaskFolderMemoryCacheService
  ) {
    super();
  }

  private async handleCacheTaskFolder(response: {
    payload: TaskFolderPayloadType;
    taskFolders: TaskFolder[];
  }) {
    try {
      const { payload, taskFolders } = response;
      const taskFolderFromCache = await lastValueFrom(
        this.getTaskFolderFromCache(payload?.companyId)
      );
      const cacheTaskFolderIds = taskFolderFromCache.map((item) => item.id);
      if (cacheTaskFolderIds.length) {
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.TASK_FOLDER,
            cacheTaskFolderIds
          )
        );
      }
      if (taskFolders.length) {
        await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.TASK_FOLDER,
            taskFolders
          )
        );
      }

      this.taskFolderMemoryCacheService.set(payload.companyId, taskFolders);
    } catch (error) {
      console.error(error);
    }
  }

  private getTaskFolderFromCache(companyId: string) {
    if (!companyId) return of([]);
    return this.indexedDBService
      .getAllByIndex<TaskFolder>(
        TrudiIndexedDBStorageKey.TASK_FOLDER,
        'companyId',
        IDBKeyRange.only(companyId)
      )
      .pipe(catchError(() => of([])));
  }

  private handleGetCacheTaskFolders(
    serverData$: Subject<void>,
    companyId: string
  ) {
    const memoryCache = this.taskFolderMemoryCacheService.get(companyId);

    const handleSetCacheMessages = (taskFolders: ITaskFolder[]) => {
      return this.store.dispatch(
        taskFolderActions.getCacheSuccess({ taskFolders })
      );
    };

    if (memoryCache) {
      return handleSetCacheMessages(memoryCache);
    }

    this.getTaskFolderFromCache(companyId)
      .pipe(
        takeUntil(serverData$),
        tap((taskFolders) => {
          if (!taskFolders.length) return;

          this.store.dispatch(
            taskFolderActions.getCacheSuccess({ taskFolders })
          );
        })
      )
      .subscribe();

    return;
  }
}
