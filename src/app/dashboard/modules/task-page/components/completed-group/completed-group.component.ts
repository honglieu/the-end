import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  takeUntil
} from 'rxjs';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { UserService } from '@/app/dashboard/services/user.service';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { CurrentUser } from '@shared/types/user.interface';
import { TaskIdSetService } from '@/app/dashboard/modules/task-page/services/task-id-set.service';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import {
  ListViewDraggableItem,
  TaskDragDropService
} from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { HeaderService } from '@services/header.service';
import { TrudiConfirmService } from '@trudi-ui';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '@services/task.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ErrorMessages } from '@services/constants';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import { Store } from '@ngrx/store';
import { taskGroupPageActions } from '@core/store/task-group';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';
import { SharedService } from '@services/shared.service';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import { GroupType } from '@shared/enum';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import {
  IGetTaskByFolder,
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import {
  ITaskRow,
  ITaskViewSettingsStatus
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  EUpdateMultipleTaskAction,
  InboxToolbarService
} from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { SharedMessageViewService } from '@services/shared-message-view.service';

@Component({
  selector: 'completed-group',
  templateUrl: './completed-group.component.html',
  styleUrls: ['./completed-group.component.scss'],
  providers: [TaskApiService]
})
@DestroyDecorator
export class CompletedGroupComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  @ViewChild('infiniteScrollView')
  infiniteScrollView: ElementRef<HTMLElement>;
  @Input() isLoading = true;
  @Input() isLoadingMore = false;
  @Input() isAllTaskFetched: boolean;
  @Input() pageIndex = 1;
  @Input() taskViewSettings: ITaskViewSettingsStatus = null;
  get taskGroupData() {
    return this._taskGroupData$.getValue();
  }
  @Input() set taskGroupData(value: IGetTaskByFolder) {
    this._taskGroupData$.next(value);
  }
  @Input() innerWidth: number;
  @Output() taskDropped = new EventEmitter<CdkDragDrop<ITaskRow>>();
  @Output() taskDragStart = new EventEmitter<void>();
  @Output() handleLoadingMore = new EventEmitter<number>();
  @Output() handleChangeTitleTask = new EventEmitter();
  @Output() openDrawer = new EventEmitter<ITaskRow>();

  private readonly destroy$ = new Subject<void>();
  private readonly _taskGroupData$ = new BehaviorSubject<IGetTaskByFolder>(
    {} as IGetTaskByFolder
  );
  public readonly taskGroupData$ = this._taskGroupData$.asObservable();
  // if the group is open at least one time, we will not render the group content again
  private readonly _onOpenCount = new BehaviorSubject<number>(0);
  public readonly shouldRenderTaskRow$ = combineLatest([
    this._onOpenCount.asObservable(),
    this.taskGroupData$
  ]).pipe(
    map(([openCount, taskGroupData]) => {
      return openCount > 0 && taskGroupData?.data?.length > 0;
    })
  );

  private currentUser: CurrentUser;
  private isFocusedView: boolean;

  public editTaskGroupName = false;
  public isOpenTaskGroup: boolean = false;
  public agencyId: string = '';
  public queryTaskId: string = '';
  public currentMailboxId: string = '';
  public currentDraggingToFolderName: string = '';
  public currentQueryParams: Params;
  private isSameFolder: boolean;
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public ETaskQueryParams = ETaskQueryParams;
  public TaskStatusType = TaskStatusType;
  public activeTaskList: string[] = [];
  public startIndex: number = -1;
  public unreadTaskGroup = 0;

  public selectedTasks: ITaskRow[] = [];
  public isTaskSelected = {};
  public isSelectedMove = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private websocketService: RxWebsocketService,
    private inboxToolbarService: InboxToolbarService,
    public loadingService: LoadingService,
    private taskIdSetService: TaskIdSetService,
    private userService: UserService,
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService,
    private taskGroupService: TaskGroupService,
    private dragService: TaskDragDropService,
    private headerService: HeaderService,
    private trudiConfirmService: TrudiConfirmService,
    private toatrService: ToastrService,
    private taskService: TaskService,
    private readonly store: Store,
    private toastCustomService: ToastCustomService,
    public sharedMessageViewService: SharedMessageViewService,
    private elementRef: ElementRef,
    private nzContextMenuService: NzContextMenuService,
    private taskApiService: TaskApiService,
    private sharedService: SharedService,
    private inboxExpandService: InboxExpandService,
    private syncTaskActivityService: SyncTaskActivityService
  ) {}

  handleScroll() {
    this.resetRightClickSelectedState();
  }

  resetRightClickSelectedState() {
    const {
      isRightClickDropdownVisibleValue,
      rightClickSelectedMessageIdValue
    } = this.sharedMessageViewService;
    if (isRightClickDropdownVisibleValue) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }
  public disableDragging = false;

  ngOnInit(): void {
    this.taskGroupService.expandedGroupIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe((idMap) => {
        this.isOpenTaskGroup = Boolean(
          idMap[this.taskGroupData?.taskGroup?.id]
        );
        this.updateOpenCount(this.isOpenTaskGroup);
      });

    this.handleDisableDrag();

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs: ITaskRow[]) => {
        this.selectedTasks = rs as ITaskRow[];
        this.isSelectedMove = rs?.length > 0;
        this.isTaskSelected = this.inboxToolbarService.selectedItemsMap;

        if (this.selectedTasks.length === 0) {
          this.handleRemoveActiveTask();
        }
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        this.currentQueryParams = queryParams;
        this.queryTaskId = queryParams['taskId'];
        this.isFocusedView =
          queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailBoxId) => {
        if (!mailBoxId) return;
        this.currentMailboxId = mailBoxId;
      });

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentUser = rs;
      });

    this.subscribeTaskSocket();
    this.subscribeSocketSeenDefaultTask();
    this.subscribeSocketUnreadConversation();
    this.subscribeSocketNewUnreadNote();
    this.subscribeConversationAction();
  }

  private handleDisableDrag() {
    const isConsoleUser = this.sharedService.isConsoleUsers();
    if (isConsoleUser) {
      this.disableDragging = true;
    } else {
      this.taskGroupService.isEditing$
        .pipe(takeUntil(this.destroy$))
        .subscribe((isEditing) => {
          this.disableDragging = isEditing;
        });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskGroupData']?.currentValue) {
      this.handleUnreadTaskGroup(this.taskGroupData);
    }
  }

  private subscribeConversationAction() {
    this.headerService.conversationAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversationAction) => {
        const allowMenuChangeAction =
          conversationAction?.isTriggeredFromToolbar;
        if (!allowMenuChangeAction) return;
        this.handleMenuChange({
          task: null,
          taskFolder: null,
          taskGroup: null,
          option: conversationAction.option as ETaskMenuOption,
          isTriggeredFromToolbar: Boolean(
            conversationAction.isTriggeredFromToolbar
          ),
          taskIds: conversationAction.messageIds
        });
      });
  }

  handleNavigateNextTask() {
    if (!this.queryTaskId) return;
    const taskIndex = this.taskGroupData?.data.findIndex(
      (item) => item.id === this.queryTaskId
    );
    if (
      taskIndex > -1 &&
      taskIndex !== this.taskGroupData?.data?.length &&
      this.taskGroupData?.data[taskIndex + 1]?.id
    ) {
      this.handleUpdateTaskIdQueryParam(
        this.taskGroupData?.data[taskIndex + 1].id
      );
    }
    if (taskIndex >= 0) {
      this.scrollToElement(taskIndex + 1, 'start');
    }
  }

  handleNavigatePreTask() {
    if (!this.queryTaskId) return;
    const taskIndex = this.taskGroupData?.data?.findIndex(
      (item) => item.id === this.queryTaskId
    );
    if (taskIndex > 0 && this.taskGroupData?.data[taskIndex - 1]?.id) {
      this.handleUpdateTaskIdQueryParam(
        this.taskGroupData?.data[taskIndex - 1].id
      );
    }
    if (taskIndex >= 0) {
      this.scrollToElement(taskIndex - 1, 'start');
    }
  }

  handleUpdateTaskIdQueryParam(taskId) {
    this.router.navigate([], {
      queryParams: {
        taskId: taskId
      },
      queryParamsHandling: 'merge'
    });
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'nearest'
  ): void {
    setTimeout(() => {
      const scrollElement = this.infiniteScrollView?.nativeElement;
      const targetElement = scrollElement?.children?.[position];
      if (!targetElement) {
        return;
      }
      targetElement.scrollIntoView({
        block,
        inline,
        behavior: 'smooth'
      });
    }, 100);
  }

  handleMenuChange(event: {
    task: ITaskRow;
    taskFolder: ITaskFolder;
    taskGroup: ITaskGroup;
    option: ETaskMenuOption | string;
    isTriggeredFromToolbar?: boolean;
    taskIds?: string[];
  }) {
    const {
      task,
      taskFolder,
      taskGroup,
      option,
      isTriggeredFromToolbar,
      taskIds
    } = event;
    const handleActionFromToolbarIfNeeded = (option?: ETaskMenuOption) => {
      if (isTriggeredFromToolbar) {
        this.handleActionFromToolbar(option, taskIds);
        return true;
      }
      return false;
    };
    switch (option) {
      case ETaskMenuOption.MOVE_TO_FOLDER:
        this.handleMoveTasksToGroup(task, taskFolder, taskGroup);
        break;
      case ETaskMenuOption.DELETE:
        if (handleActionFromToolbarIfNeeded(option)) return;
        this.handleAction(task, TaskStatusType.deleted);
        break;
      case ETaskMenuOption.SAVE_TASK_ACTIVITY_TO_PT:
        this.syncTaskActivityService.setListTasksActivity(task ? [task] : []);
        break;
      case ETaskMenuOption.DOWNLOAD_AS_PDF:
        this.syncTaskActivityService.setListTasksActivity(
          task ? [task] : [],
          true
        );
        break;
    }
  }

  handleMoveTasksToGroup(
    taskItem: ITaskRow,
    taskFolder: ITaskFolder,
    taskGroup: ITaskGroup
  ) {
    const { id: taskGroupId, isCompletedGroup } = taskGroup;
    const { id: taskFolderId, name: taskFolderName } = taskFolder;
    const taskId = taskItem.id;
    this.updateTasksMultiple(
      [taskId],
      taskItem,
      taskGroupId,
      isCompletedGroup ? TaskStatusType.completed : TaskStatusType.inprogress,
      taskFolderId,
      taskFolderName
    );
  }

  updateTasksMultiple(
    taskIds: string[],
    task: ITaskRow,
    taskGroupId?: string,
    status?: TaskStatusType,
    taskFolderId?: string,
    taskFolderName?: string
  ) {
    this.taskService
      .updateTask({
        taskIds: taskIds,
        mailBoxId: this.currentMailboxId,
        taskGroupId: taskGroupId,
        status: status
      })
      .pipe(
        map((data) => {
          if (Object.keys(data).includes('isSuccessful')) return false;
          return data;
        })
      )
      .subscribe({
        next: (rs) => {
          if (rs) {
            this.updateTaskList([task], taskFolderId, taskGroupId);
            const taskSelectedMess = `${taskIds.length} ${
              taskIds.length > 1 ? 'tasks' : 'task'
            }`;
            if (status === TaskStatusType.inprogress) {
              if (!this.isSameFolder) {
                this.toatrService.success(
                  `${taskSelectedMess} moved to ${taskFolderName}`
                );
              }
              return;
            }
            if (taskIds.length === 1) {
              const dataForToast = {
                taskId: taskIds[0],
                isShowToast: true,
                type: SocketType.changeStatusTask,
                mailBoxId: this.currentMailboxId,
                taskType: TaskType.TASK,
                status: status,
                pushToAssignedUserIds: []
              };
              this.toastCustomService.openToastCustom(
                dataForToast,
                true,
                EToastCustomType.SUCCESS_WITH_VIEW_BTN
              );
              return;
            }
            this.toatrService.success(
              `${taskSelectedMess} ${status
                .replace(TaskStatusType.deleted, 'cancelled')
                .toLocaleLowerCase()}`
            );
            return;
          }
          if (
            [TaskStatusType.completed, TaskStatusType.deleted].includes(
              status
            ) &&
            !rs
          ) {
            const errorMessage =
              status === TaskStatusType.completed
                ? ErrorMessages.RESOLVE_TASK
                : ErrorMessages.DELETE_TASK;
            this.handleShowWarningMsg(errorMessage);
          }
        },
        error: () => {
          if (status === TaskStatusType.inprogress) {
            this.toatrService.error(`Move to failed`);
            return;
          }
          this.toatrService.error(
            `${status
              .replace(TaskStatusType.deleted, 'cancelled')
              .toLowerCase()
              .replace(/\b[a-z]/g, function (letter) {
                return letter.toUpperCase();
              })} failed`
          );
        },
        complete: () => {
          // this.triggerMenu.close();
          // this.loadingAction = false;
        }
      });
  }

  handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  updateTaskList(tasks: ITaskRow[], taskFolderId: string, taskGroupId: string) {
    this.isSameFolder =
      this.currentQueryParams[ETaskQueryParams.TASKTYPEID] &&
      taskFolderId &&
      this.currentQueryParams[ETaskQueryParams.TASKTYPEID] === taskFolderId;
    this.inboxToolbarService.updateTasks({
      action: this.isSameFolder
        ? EUpdateMultipleTaskAction.CHANGE_POSITION
        : EUpdateMultipleTaskAction.DELETE,
      payload: {
        tasks: tasks,
        targetId: taskGroupId
      }
    });
  }

  private handleAction(task: ITaskRow, status: TaskStatusType) {
    if (status === TaskStatusType.deleted) {
      const confirmModalConfig = {
        title: `Are you sure you wish to delete this task?`,
        okText: 'Yes, delete',
        cancelText: 'No, keep it',
        subtitle: '',
        content: this.permanentlyDeleteConfirmModalContent,
        colorBtn: 'danger',
        iconName: 'warning',
        closable: false,
        className: 'permanently-delete-modal',
        modelWidth: 510,
        checkboxLabel: '',
        allowCheckbox: false,
        hiddenCancelBtn: false
      };
      this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
        if (!!res.result) {
          this.taskGroupData.data = [
            ...this.taskGroupData.data.map((item) => {
              if (item.id === task.id) {
                return {
                  ...item,
                  isDeleting: true
                };
              }
              return item;
            })
          ];
          this.handleConfirmPermanentlyDelete(task);
        }
      });
      return;
    }
  }

  handleConfirmPermanentlyDelete(task: ITaskRow) {
    this.inboxToolbarService.setInboxItem([]);
    this.taskGroupService.setEditMode(true);
    this.taskApiService.permanentlyDeleteTasks([task.id]).subscribe({
      next: (res) => {
        const currentFolderId = this.taskGroupData.taskGroup.taskFolderId;
        this.updateTaskList([task], currentFolderId, null);
        this.toatrService.success(`1 task deleted`);
      },
      error: () => {
        this.toatrService.error(`Deleted failed`);
      },
      complete: () => {}
    });
  }

  handleActionFromToolbar(option: ETaskMenuOption | string, taskIds: string[]) {
    switch (option) {
      case ETaskMenuOption.DELETE:
        this.taskGroupService.setEditMode(true);
        this.taskGroupData.data = [
          ...this.taskGroupData.data.map((item) => {
            if (taskIds.includes(item.id)) {
              return {
                ...item,
                isDeleting: true
              };
            }
            return item;
          })
        ];
        break;
    }
  }

  subscribeTaskSocket() {
    this.websocketService.onSocketTask
      .pipe(
        takeUntil(this.destroy$),
        filter((data) => data && data.type),
        distinctUntilChanged()
      )
      .subscribe((data) => {
        switch (data.type) {
          case SocketType.updateTask:
            this.handleUpdateTaskRealtime(data);
            break;
          case SocketType.assignTask:
            this.handleUpdateAssignTaskRealtime(data);
            break;
          case SocketType.permanentlyDeleteTask:
            this.handlePermanentlyDeleteTaskRealtime(data);
            break;
          default:
            break;
        }
      });
  }

  subscribeSocketUnreadConversation() {
    this.websocketService.onSocketUnreadConversationInTask
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            !!res &&
            !!this.taskGroupData.data.find((task) => task?.id === res?.taskId)
        )
      )
      .subscribe((rs) => {
        const newTaskGroup = {
          ...this.taskGroupData,
          data: this.taskGroupData.data.map((task) => {
            if (task.id === rs.unReadCount.taskId) {
              return {
                ...task,
                unreadConversations: rs.unReadCount.unreadConversationCount
              };
            }
            return task;
          })
        };
        this.handleUnreadTaskGroup(newTaskGroup);
      });
  }

  subscribeSocketNewUnreadNote() {
    this.websocketService.onSocketNewUnreadNoteData
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            !!res &&
            !!this.taskGroupData.data.find((task) => task?.id === res?.taskId)
        )
      )
      .subscribe((data) => {
        const newTaskGroup = {
          ...this.taskGroupData,
          data: this.taskGroupData.data?.map((task) => {
            if (task?.id === data?.taskId) {
              return {
                ...task,
                internalNoteUnreadCount: Number(data?.unreadCount)
              };
            }
            return task;
          })
        };
        this.handleUnreadTaskGroup(newTaskGroup);
        this.updateTaskGroup(newTaskGroup);
      });
  }

  handleUnreadTaskGroup(newTaskGroup: IGetTaskByFolder) {
    this.unreadTaskGroup = newTaskGroup.data.reduce(
      (sum, cur) =>
        sum +
        (cur.unreadConversations?.length || 0) +
        (cur.internalNoteUnreadCount || 0),
      0
    );
  }

  handleUpdateTaskRealtime(data) {
    if (
      !this.isFocusedView ||
      data.taskGroupId !== this.taskGroupData.taskGroup.id
    ) {
      return;
    }

    const isExistInList = this.taskGroupData.data.some(
      (task) => task.id === data.id
    );
    if (isExistInList) {
      this.taskGroupData.data = this.taskGroupData.data.map((task) => {
        if (task.id === data.id) {
          return {
            ...task,
            indexTitle: data.title || task.indexTitle
          };
        }
        return task;
      });
    }
    // this.taskFolderStoreService.updateTaskGroupData(this.taskGroupData);
    this.updateTaskGroup(this.taskGroupData);
  }

  handleUpdateAssignTaskRealtime(data) {
    if (
      !this.isFocusedView ||
      data.taskGroupId !== this.taskGroupData.taskGroup.id ||
      data.assignToAgents.some((agent) => agent.id === this.currentUser.id)
    ) {
      return;
    }

    const isExistInList = this.taskGroupData.data.some(
      (task) => task.id === data.id
    );
    if (isExistInList) {
      this._taskGroupData$.next({
        ...this.taskGroupData,
        data: this.taskGroupData.data.filter((task) => task.id !== data.id),
        meta: {
          ...this.taskGroupData.meta,
          itemCount: Number(this.taskGroupData.meta) - 1
        }
      });
      this.updateTaskGroup(this.taskGroupData);
    }
  }

  handlePermanentlyDeleteTaskRealtime(data) {
    let filteredTasksCount = 0;
    const taskIdMap: Record<string, boolean> = data.data?.taskIds?.reduce(
      (acc: Record<string, boolean>, taskId: string) => {
        acc[taskId] = true;
        return acc;
      },
      {}
    );
    this._taskGroupData$.next({
      ...this.taskGroupData,
      data: this.taskGroupData.data.filter((item) => {
        if (!taskIdMap[item.id]) {
          ++filteredTasksCount;
          return true;
        }
        return false;
      }),
      meta: {
        ...this.taskGroupData.meta,
        itemCount: Number(this.taskGroupData.meta) - filteredTasksCount
      }
    });
    this.updateTaskGroup(this.taskGroupData);
  }

  handleToggleExpandTaskGroup() {
    if (!this.taskGroupData.taskGroup.id) return;
    this.isOpenTaskGroup = !this.isOpenTaskGroup;
    this.updateOpenCount(this.isOpenTaskGroup);
    this.taskGroupService.toggleExpandGroup(this.taskGroupData.taskGroup.id);
  }

  dragMoved(event: CdkDragMove<ITaskRow>) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);
    this.taskDragStart.emit();
    this.dragService.setDragInfo(
      event,
      ListViewDraggableItem.TASK_ROW,
      this.taskGroupData?.taskGroup?.id
    );
  }

  dragDropped(event) {
    this.inboxExpandService.handleCollapseFolder();
    this.taskDropped.emit(event);
  }

  trackTaskItem(_, item: ITaskRow) {
    return item.id;
  }

  onScrollDown() {
    if (this.isAllTaskFetched || this.isLoadingMore || this.isLoading) {
      return;
    }
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (
      distanceFromBottom <= SCROLL_THRESHOLD &&
      this.pageIndex < this.taskGroupData.meta.pageCount
    ) {
      this.isLoadingMore = true;
      this.handleLoadingMore.emit(this.pageIndex + 1);

      this.store.dispatch(
        taskGroupPageActions.nextPage({
          page: this.pageIndex + 1
        })
      );
    }
  }

  handleAssignTaskRealTime(data: any): boolean {
    if (data.type != SocketType.assignTask || !data.id) return false;
    const task = data as ITaskRow;
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
      const newData = this.taskGroupData?.data?.filter(
        (item) => item.id !== data.id
      );
      const taskGroupData = {
        ...this.taskGroupData,
        data: newData
      };
      this.updateTaskGroup(taskGroupData);
    }
    return true;
  }

  subscribeSocketSeenDefaultTask() {
    // Note: handle unread conversation in task-group and hide auto-reopened badge
    this.websocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (prev, curr) => prev.socketTrackId === curr.socketTrackId
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
          let updatedTaskGroupData = {
            ...this.taskGroupData,
            data: [...this.taskGroupData.data]
          };
          conversations.forEach((conversation) => {
            const findTaskIndex = this.taskGroupData.data?.findIndex(
              (it) => it.id === conversation.taskId
            );
            if (conversation.taskType === TaskType.TASK && findTaskIndex > -1) {
              updatedTaskGroupData.data = updatedTaskGroupData.data.map(
                (it) => {
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
                }
              );
            }
          });

          this.handleUnreadTaskGroup(updatedTaskGroupData);
          this.updateTaskGroup(updatedTaskGroupData);
        } else {
          const findTaskIndex = this.taskGroupData.data?.findIndex(
            (it) => it.id === taskId
          );
          if (taskType === TaskType.TASK && findTaskIndex > -1) {
            const newTasks = this.taskGroupData?.data?.map((it) => {
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
            const newTaskGroupData = {
              ...this.taskGroupData,
              data: newTasks
            };
            this.handleUnreadTaskGroup(newTaskGroupData);
            this.updateTaskGroup(newTaskGroupData);
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
      this.taskGroupData.data
    );

    const newSelectedTasks: ITaskRow[] = [
      ...this.selectedTasks.filter(
        (task) => !this.taskGroupData.data.some((it) => it.id === task.id)
      ),
      ...this.taskGroupData.data.filter((task) =>
        this.activeTaskList.some((it) => it === task.id)
      )
    ];
    this.inboxToolbarService.setInboxItem(newSelectedTasks);
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

  triggerChangeTitleTask(value) {
    this.handleChangeTitleTask.emit(value);
  }

  updateTaskGroup(taskGroupData) {
    this.store.dispatch(
      taskGroupActions.updateTaskGroup({
        taskGroup: taskGroupData,
        taskGroupId: taskGroupData.taskGroup.id
      })
    );
  }

  private updateOpenCount(value: boolean) {
    const currentCount = this._onOpenCount.getValue();
    if (value && currentCount === 0) {
      this._onOpenCount.next(currentCount + 1);
    }
  }

  ngOnDestroy(): void {
    this.taskIdSetService.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
