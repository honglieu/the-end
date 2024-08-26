import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEqual } from 'lodash-es';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { IMailboxSetting } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { CustomReuseStrategy } from '@/app/reuse-strategy';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { GroupType } from '@shared/enum/user.enum';
import { TaskItem } from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { DefaultTaskListService } from '@/app/dashboard/modules/task-page/services/default-task-list.service';
import { isFilterTaskListChange } from '@/app/dashboard/modules/task-page/utils/function';
import { TaskIdSetService } from '@/app/dashboard/modules/task-page/services/task-id-set.service';
import { cloneDeep } from 'lodash-es';
import { AppRouteName } from '@shared/enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import dayjs from 'dayjs';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  EUpdateMultipleTaskAction,
  IUpdateMultipleTask,
  InboxToolbarService
} from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { hasTaskFilter } from '@/app/dashboard/modules/inbox/utils/function';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { SharedMessageViewService } from '@services/shared-message-view.service';

@Component({
  selector: 'default-task-list',
  templateUrl: './default-task-list.component.html',
  styleUrls: ['./default-task-list.component.scss'],
  providers: [TaskApiService, DefaultTaskListService]
})
@DestroyDecorator
export class DefaultTaskListComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  private destroy$ = new Subject<void>();
  public isScrolledToBottom = false;
  public pageIndex = 1;
  public agencyId: string = '';
  public currentMailboxId: string = '';
  public currentQueryParams: Params;
  public totalTask = 0;
  public isLoading: boolean = true;
  public inboxFilterSelectedType = EInboxFilterSelected;
  private currentUser: CurrentUser;
  public isLoadingMore: boolean = false;
  private isFocusedView: boolean;
  public defaultTaskList: ITaskRow[] = [];
  public ETaskQueryParams = ETaskQueryParams;
  public TaskStatusType = TaskStatusType;
  public activeTaskList: string[] = [];
  public startIndex: number = -1;
  public hasFilter: boolean = false;
  private _fetchedTaskIds = new Map<string, boolean>();
  private _isAllTaskFetched: boolean;
  public timeZone = this.agencyDateFormatService.getCurrentTimezone();

  constructor(
    private activatedRoute: ActivatedRoute,
    private agencyService: AgencyService,
    private statisticService: StatisticService,
    private websocketService: RxWebsocketService,
    private inboxToolbarService: InboxToolbarService,
    public loadingService: LoadingService,
    private taskIdSetService: TaskIdSetService,
    private userService: UserService,
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService,
    private defaultTaskListService: DefaultTaskListService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private elementRef: ElementRef,
    private reuseRoute: CustomReuseStrategy
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  handleScroll() {
    this.resetRightClickSelectedState();
  }

  resetRightClickSelectedState() {
    const {
      isRightClickDropdownVisibleValue,
      rightClickSelectedMessageIdValue
    } = this.sharedMessageViewService;
    if (
      isRightClickDropdownVisibleValue &&
      this.defaultTaskList.some(
        (task) => task.id === rightClickSelectedMessageIdValue
      )
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }
  ngOnInit(): void {
    combineLatest([
      this.activatedRoute.queryParams.pipe(
        filter((queryParam) => {
          const isFilterChange = isFilterTaskListChange(
            this.currentQueryParams,
            queryParam
          );
          this.currentQueryParams = queryParam;
          return isFilterChange;
        })
      ),
      // Prevent call api when change mailbox
      // Note: Navigate to inbox tab when change mailbox
      this.inboxService
        .getCurrentMailBoxId()
        .pipe(filter((mailBoxId) => Boolean(mailBoxId))),
      this.mailboxSettingService.mailboxSetting$
    ])
      .pipe(
        tap(([queryParams, mailBoxId]) => {
          this.currentMailboxId = mailBoxId;
          this.currentQueryParams = queryParams;
          this.isFocusedView =
            queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK;
          this.inboxService.setIsAllFiltersDisabled(true);
        }),
        distinctUntilChanged((previous, current) => isEqual(previous, current)),
        switchMap(([queryParams, mailBoxId, mailBoxSetting]) => {
          return this.getAllTask(mailBoxSetting, queryParams, mailBoxId);
        }),
        filter((res) => !!res)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingMore = false;
          this.totalTask = res.meta.itemCount;
          const newTasks: ITaskRow[] = [];
          for (const task of res.data) {
            if (!this._fetchedTaskIds.get(task.id)) {
              newTasks.push(task);
              this._fetchedTaskIds.set(task.id, true);
            }
          }
          if (newTasks.length) {
            this.defaultTaskList = cloneDeep([
              ...this.defaultTaskList,
              ...newTasks
            ]);
          }

          if (!this.isLoading || newTasks.length) {
            this.viewport?.checkViewportSize();
          }

          this.inboxService.setIsAllFiltersDisabled(false);
        },
        error: () => {
          this.isLoadingMore = false;
        }
      });

    this.statisticService.statisticTotalTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) this.totalTask = res;
      });

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs: ITaskRow[]) => {
        this.defaultTaskList = this.defaultTaskList.map((task) => {
          const isChecked = !!rs.some((item) => item.id === task.id);
          return {
            ...task,
            checked: isChecked
          };
        });
        if (rs.length === 0) {
          this.handleRemoveActiveTask();
        }
      });

    this.subscribeSocket();
    this.subscribeMoveTaskToGroupEvent();
    this.onSocketSeenDefaultTask();

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentUser = rs;
      });

    this.inboxToolbarService.updateMultipleTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          this.updateListView(rs);
        }
      });
  }

  private getAllTask(
    mailBoxSetting: IMailboxSetting,
    queryParams: Params,
    mailBoxId: string
  ) {
    return this.reuseRoute.onRetrieve$.pipe(
      startWith(null),
      filter(
        (route) => !route || route.data?.['name'] === AppRouteName.DEFAULT_TASKS
      ),
      tap((route) => {
        if (
          this.currentMailboxId !== mailBoxId ||
          !isEqual(queryParams, route?.queryParams)
        ) {
          this.isLoading = true;
          this.defaultTaskList = [];
          this._fetchedTaskIds.clear();
        }
      }),
      debounceTime(300),
      switchMap(() => {
        this.pageIndex = 1;
        this._isAllTaskFetched = false;
        const ignoreParams = mailBoxSetting?.teamMembers <= 1;
        const isConsole = this.sharedService.isConsoleUsers();
        const {
          search,
          inboxType,
          assignedTo,
          propertyManagerId,
          taskStatus,
          eventType,
          startDate,
          endDate,
          taskEditorId
        } = queryParams || {};
        this.hasFilter = hasTaskFilter(queryParams);
        const body = {
          status: taskStatus,
          search,
          isFocusedView: isConsole
            ? false
            : inboxType === TaskStatusType.my_task,
          mailBoxId,
          assigneeIds: !ignoreParams ? assignedTo : [],
          propertyManagerIds: !ignoreParams ? propertyManagerId : [],
          events: {
            eventTypes: eventType || [],
            startDate: startDate
              ? dayjs(startDate).tz(this.timeZone?.value).toISOString()
              : null,
            endDate: endDate
              ? dayjs(endDate)
                  .add(1, 'd')
                  .subtract(1, 's')
                  .tz(this.timeZone?.value)
                  .toISOString()
              : null
          },
          taskTypeIds: taskEditorId || [],
          page: 1,
          pageSize: 20
        };

        this.defaultTaskListService.fetchTaskList(body);
        return this.defaultTaskListService.getAllTask().pipe(
          tap((res) => {
            this.isLoading = false;
            this._isAllTaskFetched = !res.data.length;
          })
        );
      })
    );
  }

  updateListView(updateTaskData: IUpdateMultipleTask) {
    const taskIds = updateTaskData.payload.tasks.map((item) => item.id);
    const { action } = updateTaskData;
    switch (action) {
      case EUpdateMultipleTaskAction.DELETE:
        this.defaultTaskList =
          this.defaultTaskList.filter((task) => {
            return !taskIds.includes(task.id);
          }) || [];
        break;
    }
  }

  subscribeMoveTaskToGroupEvent() {
    this.websocketService.onSocketMoTaskToGroup
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        const { tasks } = (rs.data as any)?.data || rs.data || {};
        this.updateListView({
          action: EUpdateMultipleTaskAction.DELETE,
          payload: {
            tasks: tasks
          }
        });
      });
  }

  subscribeSocket() {
    this.websocketService.onSocketTask
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (!res || this.agencyId !== res.agencyId) return;
        this.handleUpdateTaskRealTime(res) ||
          this.handleAssignTaskRealTime(res) ||
          this.handleChangeStatusTaskRealTime(res);
      });
  }

  trackTaskItem(_, item: ITaskRow) {
    return item.id;
  }

  onScrollDown() {
    if (this._isAllTaskFetched || this.isLoadingMore || this.isLoading) {
      return;
    }
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom <= SCROLL_THRESHOLD) {
      this.isLoadingMore = true;
      this.pageIndex = this.pageIndex + 1;
      this.defaultTaskListService.fetchTaskList({
        page: this.pageIndex
      });
    }
  }

  handleChangeStatusTaskRealTime(data: any): boolean {
    if (data.type != SocketType.changeStatusTask) return false;
    this.defaultTaskList = this.defaultTaskList.filter(
      (item) => !(data?.taskId === item.id)
    );
    return true;
  }

  handleUpdateTaskRealTime(data: any): boolean {
    if (data.type != SocketType.updateTask || !data.task) return false;
    data = data.task.find((item: any) => Array.isArray(item)) ?? [];
    const foundTask = this.defaultTaskList.find(
      (task) => task.id === data[0].id
    );
    if (!foundTask) return false;
    foundTask.title = data[0].title || foundTask.title;
    return true;
  }

  handleAssignTaskRealTime(data: any): boolean {
    if (data.type != SocketType.assignTask || !data.id) return false;
    const task = data as TaskItem;
    const isAssignedToPM =
      task.assignToAgents.some((agent) => agent.id === this.currentUser.id) &&
      [TaskStatusType.team_task, TaskStatusType.unassigned].includes(
        this.currentQueryParams[ETaskQueryParams.INBOXTYPE]
      );
    const isUnassignedPM =
      !task.assignToAgents.some((agent) => agent.id === this.currentUser.id) &&
      this.currentQueryParams[ETaskQueryParams.INBOXTYPE] ===
        TaskStatusType.my_task;
    if (this.isFocusedView && (isAssignedToPM || isUnassignedPM)) {
      this.defaultTaskList = this.defaultTaskList?.filter(
        (item) => item.id !== data.id
      );
    }
    return true;
  }

  private onSocketSeenDefaultTask() {
    // Note: handle unread conversation in task-group and hide auto-reopened badge
    this.websocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (prev, curr) => prev.socketTrackId === curr.socketTrackId
        ),
        filter((res) =>
          this.websocketService.checkIgnoreCurrentUser(res?.fromUserId)
        )
      )
      .subscribe((res) => {
        const {
          isSeen,
          taskId,
          taskType,
          conversationId,
          isBulkSeen,
          conversations
        } = res;
        if (isBulkSeen) {
          let updatedTaskList = [...this.defaultTaskList];

          conversations.forEach((conversation) => {
            const findTaskIndex = updatedTaskList.findIndex(
              (it) => it.id === conversation.taskId
            );
            if (conversation.taskType === TaskType.TASK && findTaskIndex > -1) {
              updatedTaskList = updatedTaskList.map((it) => {
                if (it.id === conversation.taskId) {
                  const updateReadConversation = [
                    ...it.unreadConversations
                  ].filter(
                    (unreadId) => unreadId !== conversation.conversationId
                  );
                  if (!isSeen) {
                    updateReadConversation.push(conversation.conversationId);
                  }
                  return {
                    ...it,
                    unreadConversations: updateReadConversation
                  };
                }
                return it;
              });
            }
          });

          this.defaultTaskList = updatedTaskList;
        } else {
          const findTaskIndex = this.defaultTaskList?.findIndex(
            (it) => it.id === taskId
          );
          if (taskType === TaskType.TASK && findTaskIndex > -1) {
            this.defaultTaskList = this.defaultTaskList.map((it) => {
              if (it.id === taskId) {
                const updateReadConversation = [
                  ...it.unreadConversations
                ].filter((it) => it !== conversationId);
                if (!isSeen) {
                  updateReadConversation.push(conversationId);
                }
                return {
                  ...it,
                  unreadConversations: updateReadConversation
                };
              }
              return it;
            });
          }
        }
      });
  }

  handleSelectedTasks(event) {
    this.activeTaskList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeTaskList,
      this.defaultTaskList
    );
  }

  handleAddSelectedTask(event) {
    const res = addItem(
      event.currentTaskId,
      event.currentTaskIndex,
      this.activeTaskList
    );
    if (res) {
      this.activeTaskList = res.activeItems;
      this.startIndex = res._startIndex;
    }
  }

  handleRemoveActiveTask(currentMsgId?: string) {
    const { activeItems, _startIndex } = removeActiveItem(
      this.activeTaskList,
      this.startIndex,
      currentMsgId
    );
    this.activeTaskList = activeItems;
    this.startIndex = _startIndex;
  }

  ngOnDestroy(): void {
    this.taskIdSetService.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
