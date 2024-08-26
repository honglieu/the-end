import { TrudiIndexedDBStorageKey } from '@core';
import { TrudiIndexedDBIndexKey } from '@core';
import {
  IGetTaskByFolder,
  IGetTaskByFolderPayload,
  IGetTasksByGroupPayload
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { forkJoin, lastValueFrom, of, Subject } from 'rxjs';
import {
  catchError,
  first,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { taskGroupApiActions } from '@core/store/task-group/actions/task-group-api.actions';
import { taskGroupPageActions } from '@core/store/task-group/actions/task-group-page.actions';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';
import {
  selectAllTaskGroup,
  selectCompletedTaskGroupPayload,
  selectTaskGroupPayload
} from '@core/store/task-group/selectors/task-group.selectors';
import { IDBITaskGroup, IDBITaskRow } from '@core/store/task-group/types';
import { UserService } from '@services/user.service';
import { TaskGroupMemoryCacheService } from '@core/store/task-group/services/task-group-memory-cache.service';
import { TrudiEffect } from '@core/store/shared/trudi-effect';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { ESortTaskType } from '@/app/dashboard/modules/task-page/utils/enum';

@Injectable()
export class TaskGroupEffects extends TrudiEffect {
  private hasInitiated = false;
  private readonly onExitPage$ = new Subject<void>();

  readonly payloadChangeThenGetCache$ = createEffect(() =>
    this.action$.pipe(
      ofType(taskGroupPageActions.payloadChange),
      switchMap(({ payloadProcess, payloadCompleted }) => {
        if (this.shouldCacheTaskGroups(payloadProcess)) {
          // emit data when api response
          const serverDataNotifier$ = new Subject<void>();
          const handleGetCacheSuccess = (
            cache: Array<IDBITaskGroup | IGetTaskByFolder>
          ) =>
            this.store.dispatch(
              taskGroupActions.getCacheTaskGroup({ taskGroups: cache })
            );

          const memoryCache = this.taskGroupMemoryCacheService.get(
            payloadProcess.taskFolderId
          );

          if (memoryCache) {
            handleGetCacheSuccess(memoryCache);
          } else {
            this.getCacheTaskGroup(payloadProcess)
              .pipe(
                first(),
                // if data come from server first, cancel get data from cache
                takeUntil(serverDataNotifier$),
                tap(([taskGroups, taskList]) =>
                  handleGetCacheSuccess(this.mergeData(taskGroups, taskList))
                )
              )
              .subscribe();
          }
          return this.getTaskGroupApi(payloadProcess, payloadCompleted).pipe(
            tap(() => {
              // notify to cancel get data from cache
              serverDataNotifier$.next();
              serverDataNotifier$.complete();
            })
          );
        }
        return this.getTaskGroupApi(payloadProcess, payloadCompleted);
      })
    )
  );

  readonly taskGroupChange$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(taskGroupActions.setTaskGroup),
        tap(({ taskGroups }) => {
          this.updateCacheTaskGroup(taskGroups);
        })
      ),
    { dispatch: false }
  );

  readonly onSetAllTaskGroups$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(taskGroupActions.setAll),
        concatLatestFrom(() => this.store.select(selectTaskGroupPayload)),
        tap(([{ taskGroups }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.taskGroupMemoryCacheService.set(
            payload.taskFolderId,
            taskGroups
          );
          this.scheduleLowPriorityTask(() => {
            this.syncStateAndLocalData(
              taskGroups,
              payload as IGetTaskByFolderPayload
            );
          });
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(taskGroupPageActions.nextPage),
      concatLatestFrom(() => [
        this.store.select(selectCompletedTaskGroupPayload),
        this.store.select(selectAllTaskGroup)
      ]),
      switchMap(([res, payloadCompleted, taskGroups]) => {
        const payload = { ...payloadCompleted, page: res.page };
        return this.getCompleteGroupApi(
          payload as IGetTasksByGroupPayload
        ).pipe(
          map((response) => {
            const newTaskGroups = taskGroups.map((taskGroup) => {
              if (taskGroup.taskGroup.id === payload.taskGroupId) {
                return {
                  ...taskGroup,
                  data: taskGroup.data.concat(response.data)
                };
              }
              return taskGroup;
            });
            return taskGroupApiActions.getTaskGroupsSuccess({
              taskGroup: newTaskGroups,
              isCompletedGroupLoading: false,
              isAllCompletedTaskFetched: !response.data.length
            });
          })
        );
      })
    )
  );

  readonly sortCompletedTaskChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(taskGroupPageActions.sortCompletedTaskChange),
      concatLatestFrom(() => [
        this.store.select(selectCompletedTaskGroupPayload),
        this.store.select(selectAllTaskGroup)
      ]),
      switchMap(([res, payloadCompleted, taskGroups]) => {
        const payload = {
          ...payloadCompleted,
          page: 1,
          isDESC: res.sortTaskType === ESortTaskType.NEWEST_TO_OLDEST
        };
        if (payload.taskGroupId.length) {
          return this.getCompleteGroupApi(
            payload as IGetTasksByGroupPayload
          ).pipe(
            map((response) => {
              const newTaskGroups = taskGroups.map((taskGroup) => {
                if (taskGroup.taskGroup.id === payload.taskGroupId) {
                  return {
                    ...taskGroup,
                    data: response.data
                  };
                }
                return taskGroup;
              });
              return taskGroupApiActions.getTaskGroupsSuccess({
                taskGroup: newTaskGroups,
                isCompletedGroupLoading: false,
                isAllCompletedTaskFetched: !response.data.length
              });
            })
          );
        }
        return of();
      })
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(taskGroupPageActions.exitPage),
        map(() => {
          this.onExitPage$.next();
          this.taskGroupMemoryCacheService.clear();
        })
      ),
    { dispatch: false }
  );

  private getCacheTaskGroup(payload: IGetTaskByFolderPayload) {
    return forkJoin([
      this.getCacheTaskGroups(payload),
      this.getCacheTasks(payload)
    ]);
  }

  private updateCacheTaskGroup(taskGroups: IGetTaskByFolder[]) {
    return this.indexedDBService
      .update(TrudiIndexedDBStorageKey.TASK_GROUP, {
        taskGroups
      })
      .pipe(
        catchError(() => {
          return of(null);
        })
      )
      .subscribe();
  }

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly dashboardApiService: DashboardApiService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly userService: UserService,
    private readonly taskApiService: TaskApiService,
    private readonly zone: NgZone,
    private readonly taskGroupMemoryCacheService: TaskGroupMemoryCacheService
  ) {
    super();
  }

  private handleCacheTaskGroup(response: {
    payload: IGetTaskByFolderPayload;
    taskGroup: IGetTaskByFolder[];
  }) {
    this.scheduleLowPriorityTask(() => {
      this.syncServerAndLocalData(response.taskGroup, response.payload);
    });
  }

  private getCompleteGroupApi(payload: IGetTasksByGroupPayload) {
    return this.taskApiService
      .getTasksByGroup(payload)
      .pipe(catchError(() => of(null)));
  }

  private getTasksApi(payload: IGetTaskByFolderPayload) {
    return this.dashboardApiService.getTaskByFolder(payload).pipe(
      map((tasks) => {
        return tasks?.filter((task) => !task?.taskGroup?.isCompletedGroup);
      }),
      catchError(() => of(null))
    );
  }

  private getTaskGroupApi(
    payloadProcess: IGetTaskByFolderPayload,
    payloadCompleted: IGetTasksByGroupPayload
  ) {
    return forkJoin({
      tasks: this.getTasksApi(payloadProcess),
      completedTasks: this.getCompleteGroupApi(payloadCompleted)
    }).pipe(
      takeUntil(this.onExitPage$),
      map(({ tasks, completedTasks }) => {
        if (!tasks && !completedTasks) {
          return taskGroupApiActions.getTaskGroupsFailure({ error: true });
        }

        const payload = {
          payloadProcess,
          payloadCompleted
        };
        const taskRes = tasks.concat(completedTasks);

        this.taskGroupMemoryCacheService.set(
          payloadProcess.taskFolderId,
          taskRes
        );

        return taskGroupApiActions.getTaskGroupsSuccess({
          taskGroup: taskRes,
          isCompletedGroupLoading: false,
          isAllCompletedTaskFetched: !completedTasks.data.length,
          payload
        });
      }),
      tap(() => (this.hasInitiated = true)),
      tap((data) => {
        if (data['taskGroup']) {
          this.handleCacheTaskGroup({
            payload: payloadProcess,
            taskGroup: data['taskGroup']
          });
        }
      })
    );
  }

  private getCacheTaskGroups(payload: IGetTaskByFolderPayload) {
    return this.indexedDBService.getAllByIndex<IDBITaskGroup>(
      TrudiIndexedDBStorageKey.TASK_GROUP,
      TrudiIndexedDBIndexKey.TASK_FOLDER_ID,
      IDBKeyRange.only(payload.taskFolderId)
    );
  }

  private getCacheTasks(payload: IGetTaskByFolderPayload) {
    return this.indexedDBService
      .getAllByIndex<IDBITaskRow>(
        TrudiIndexedDBStorageKey.TASK_LIST,
        TrudiIndexedDBIndexKey.TASK_FOLDER_ID,
        IDBKeyRange.only(payload.taskFolderId)
      )
      .pipe(
        map((res) => {
          const currentUserId =
            this.userService.userInfo$.getValue()?.id ||
            localStorage.getItem('userId');
          return res.filter(
            (r) =>
              !payload.isFocusedView ||
              r.assignToAgents?.some((aa) => aa.id === currentUserId)
          );
        })
      );
  }

  private async syncServerAndLocalData(
    newTasks: IDBITaskGroup[],
    payload: IGetTaskByFolderPayload
  ) {
    if (this.shouldCacheTaskGroups(payload)) {
      const cachedTaskGroups = await lastValueFrom(
        this.getCacheTaskGroups(payload)
      );
      const cachedTasks = await lastValueFrom(this.getCacheTasks(payload));

      const compareToken = `${payload.taskFolderId}`;

      const cachedTaskGroupToBeUpdated = [];
      const deletedTaskGroupIds = [];
      const cachedTaskToBeUpdated = [];
      const deletedTaskIds = [];

      const updatedDataTaskGroup = newTasks.map((tg) => {
        const { taskGroup, meta } = tg;
        const _existed = cachedTaskGroups.find((x) => x.id === taskGroup.id);
        return {
          ..._existed,
          taskGroup,
          meta,
          [TrudiIndexedDBIndexKey.TASK_FOLDER_ID]: payload.taskFolderId,
          id: taskGroup.id
        };
      });

      const newTaskList = newTasks?.map((tg) => tg.data).flat() || [];
      const updatedDataTasks = newTaskList.map((t) => {
        const _existed = cachedTasks.find((x) => x.id === t.id);
        return {
          ..._existed,
          ...t,
          [TrudiIndexedDBIndexKey.TASK_FOLDER_ID]: payload.taskFolderId
        };
      });

      // Upsert taskGroup
      for (const cachedTaskGroup of cachedTaskGroups) {
        if (`${cachedTaskGroup.taskFolderId}` === compareToken) {
          cachedTaskGroupToBeUpdated.push(cachedTaskGroup);
          deletedTaskGroupIds.push(cachedTaskGroup.id);
        }
      }
      if (deletedTaskGroupIds.length) {
        const deleteResult = await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.TASK_GROUP,
            deletedTaskGroupIds
          )
        );
        console.debug('delete task group result', deleteResult);
      }
      if (newTasks.length) {
        const addResult = await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.TASK_GROUP,
            updatedDataTaskGroup
          )
        );
        console.debug('add task group result', addResult);
      }

      // Upsert taskList
      for (const cachedTask of cachedTasks) {
        const { taskFolderId } = cachedTask;
        if (`${taskFolderId}` === compareToken) {
          const cachedTaskData = {
            ...cachedTask,
            taskFolderId: payload.taskFolderId
          };
          cachedTaskToBeUpdated.push(cachedTaskData);
          deletedTaskIds.push(cachedTaskData.id);
        }
      }

      if (deletedTaskIds.length) {
        const deleteResult = await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.TASK_LIST,
            deletedTaskIds
          )
        );
        console.debug('delete task list result', deleteResult);
      }
      if (newTaskList.length) {
        const addResult = await lastValueFrom(
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.TASK_LIST,
            updatedDataTasks
          )
        );
        console.debug('add task list result', addResult);
      }
    }
  }

  private shouldCacheTaskGroups(payload: IGetTaskByFolderPayload) {
    if (!payload) return false;
    if (payload.search?.length) return false;
    if (payload.events?.eventTypes.length) return false;
    if (payload.events?.endDate) return false;
    if (payload.events?.startDate) return false;
    if (payload.assigneeIds?.length) return false;
    if (payload.propertyManagerIds?.length) return false;
    if (payload.taskGroupIds?.length) return false;
    if (payload.taskTypeIds?.length) return false;
    return true;
  }

  private async syncStateAndLocalData(
    newTasks: IDBITaskGroup[],
    payload: IGetTaskByFolderPayload
  ) {
    const compareToken = `${payload.taskFolderId}`;
    const cachedTaskGroups = await lastValueFrom(
      this.getCacheTaskGroups(payload)
    );
    const cachedTasks = await lastValueFrom(this.getCacheTasks(payload));

    const taskGroupIdMap = cachedTaskGroups.reduce((map, taskGroup) => {
      map.set(taskGroup.id, true);
      return map;
    }, new Map<string, boolean>());
    const currentTaskGroups = newTasks.map((tg) => {
      const { taskGroup, meta } = tg;
      const _existed = cachedTaskGroups.find((x) => taskGroupIdMap.get(x.id));
      return {
        ..._existed,
        taskGroup,
        meta,
        taskFolderId: payload.taskFolderId,
        id: taskGroup.id
      };
    });
    const taskGroupMap: Record<string, IDBITaskGroup> =
      currentTaskGroups.reduce((map, taskGroup) => {
        map[taskGroup.taskGroup.id] = taskGroup;
        return map;
      }, {});
    const deletedTaskGroupIds = [];
    //update task group
    for (const cachedTaskGroup of cachedTaskGroups) {
      if (`${cachedTaskGroup.taskFolderId}` === compareToken) {
        if (taskGroupMap[cachedTaskGroup.taskGroup.id]) {
          this.indexedDBService
            .update(
              TrudiIndexedDBStorageKey.TASK_GROUP,
              taskGroupMap[cachedTaskGroup.taskGroup.id]
            )
            .subscribe();
        } else {
          deletedTaskGroupIds.push(cachedTaskGroup.taskGroup.id);
        }
      }
    }
    if (deletedTaskGroupIds.length) {
      const deleteResult = await lastValueFrom(
        this.indexedDBService.bulkDelete(
          TrudiIndexedDBStorageKey.TASK_GROUP,
          deletedTaskGroupIds
        )
      );
      console.debug('delete task group result', deleteResult);
    }

    const taskIdMap = cachedTaskGroups.reduce((map, taskGroup) => {
      map.set(taskGroup.id, true);
      return map;
    }, new Map<string, boolean>());
    const newTaskList = newTasks?.map((tg) => tg.data).flat() || [];
    const currentTasks = newTaskList.map((t) => {
      const _existed = cachedTasks.find((x) => taskIdMap.get(x.id));
      return {
        ..._existed,
        ...t,
        taskFolderId: payload.taskFolderId
      };
    });
    const taskMap: Record<string, IDBITaskRow> = currentTasks.reduce(
      (map, task) => {
        map[task.id] = task;
        return map;
      },
      {}
    );
    const deletedTaskIds = [];
    //update task list
    for (const cachedTask of cachedTasks) {
      if (`${cachedTask.taskFolderId}` === compareToken) {
        if (taskMap[cachedTask.id]) {
          this.indexedDBService
            .update(TrudiIndexedDBStorageKey.TASK_LIST, taskMap[cachedTask.id])
            .subscribe();
        } else {
          deletedTaskIds.push(cachedTask.id);
        }
      }
    }
    if (deletedTaskIds.length) {
      const deleteResult = await lastValueFrom(
        this.indexedDBService.bulkDelete(
          TrudiIndexedDBStorageKey.TASK_LIST,
          deletedTaskIds
        )
      );
      console.debug('delete task list result', deleteResult);
    }
  }

  private mergeData(taskGroups: IDBITaskGroup[], taskLists: IDBITaskRow[]) {
    const mergedArray = taskGroups.map((tg) => {
      const { taskGroup, meta } = tg;
      return {
        taskGroup,
        meta,
        data: taskLists.filter((tl) => tl.taskGroupId === taskGroup.id)
      };
    });

    return mergedArray;
  }
}
