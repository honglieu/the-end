import { TaskFolderMemoryCacheService } from '@core/store/taskFolder';
import { taskFolderApiActions } from '@core/store/taskFolder/actions/task-folder-api.actions';
import { TaskStatusType } from '@shared/enum';
import { TaskItem } from '@shared/types/task.interface';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';
import {
  EInboxFilterSelected,
  IMessageQueryParams
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { CompanyService } from '@services/company.service';

@Injectable()
export class DashboardSecondaryDataService {
  constructor(
    private readonly inboxService: InboxService,
    private readonly dashboardApiService: DashboardApiService,
    private readonly messageApiService: MessageApiService,
    private readonly store$: Store,
    private readonly taskFolderMemoryCacheService: TaskFolderMemoryCacheService,
    private readonly companyService: CompanyService
  ) {}

  public loadSecondaryData() {
    return forkJoin({
      messages: this.getMessages(),
      taskFolders: this.getTaskFolders()
    });
  }

  private getCurrentMailBoxId() {
    const listMailBoxes$ = this.inboxService.listMailBoxs$.pipe(
      first((mailBoxes) => Array.isArray(mailBoxes))
    );
    const mailBoxId$ = this.inboxService
      .getCurrentMailBoxId()
      .pipe(distinctUntilChanged(), first(Boolean));
    return listMailBoxes$.pipe(
      switchMap((mailBoxes) => {
        if (!mailBoxes.length) return of(null);
        return mailBoxId$;
      })
    );
  }

  private getCurrentCompanyId() {
    const companyId$ = this.companyService
      .getCurrentCompanyId()
      .pipe(distinctUntilChanged(), first(Boolean));
    return companyId$;
  }

  private getMessages() {
    if (!this.shouldCallAPI()) return of(null);
    return this.getCurrentMailBoxId().pipe(
      switchMap((mailBoxId) => {
        if (!mailBoxId) return of(null);
        const payload: any = {
          mailBoxId,
          page: 0,
          limit: 20,
          pageLimit: 20,
          search: '',
          assignedTo: [],
          propertyManagerId: [],
          messageStatus: [],
          taskDeliveryFailIds: [],
          topicId: '',
          propertyId: '',
          excludeUnHappyPath: false,
          excludeConversation: false,
          onlyTask: false,
          showMessageInTask: false
        };

        const types = [TaskStatusType.my_task, TaskStatusType.team_task];
        const statuses = [TaskStatusType.inprogress];

        const tasks: Observable<{ tasks: TaskItem }>[] = [];
        for (const type of types) {
          for (const status of statuses) {
            tasks.push(
              this.messageApiService.getMessages({
                ...payload,
                type,
                status
              } as IMessageQueryParams)
            );
          }
        }

        return forkJoin(tasks).pipe(
          map((listResponse) => {
            const initialValue = [];
            const messages =
              listResponse?.reduce(
                (acc, curr) => acc.concat(curr?.tasks ?? []),
                initialValue
              ) ?? initialValue;
            return messages;
          }),
          catchError(() => of(null))
        );
      })
    );
  }

  private shouldCallAPI() {
    // we need use window object because when app init the angular's route doesn't have data
    const queryParams = Object.fromEntries(
      new URLSearchParams(window.location.search)
    );
    if (!queryParams) return false;
    if (queryParams['currentTaskId']?.length) return false;
    if (queryParams[EInboxFilterSelected.SEARCH]?.length) return false;
    if (queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length) return false;
    if (queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length)
      return false;
    if (queryParams[EInboxFilterSelected.TASK_ID]?.length) return false;
    if (queryParams[EInboxFilterSelected.CONVERSATION_ID]?.length) return false;
    if (queryParams[EInboxFilterSelected.CONVERSATION_LOG_ID]?.length)
      return false;
    if (queryParams[EInboxFilterSelected.MESSAGE_STATUS]?.length) return false;
    return true;
  }

  private getTaskFolders() {
    return this.getCurrentCompanyId().pipe(
      switchMap((companyId) => {
        if (!companyId) return of(null);
        return this.dashboardApiService.getTaskFolders(companyId).pipe(
          tap((response) => {
            this.store$.dispatch(
              taskFolderApiActions.getTaskFolderSuccess({
                taskFolders: response?.taskFolders ?? [],
                payload: response?.payload
              })
            );
            this.taskFolderMemoryCacheService.set(
              companyId,
              response?.taskFolders ?? []
            );
          }),
          catchError(() => of(null))
        );
      })
    );
  }
}
