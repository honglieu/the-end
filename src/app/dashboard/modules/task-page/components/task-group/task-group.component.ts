import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { FormControl, Validators } from '@angular/forms';
import { TrudiTextFieldComponent } from '@trudi-ui';
import {
  BehaviorSubject,
  Subject,
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  of,
  takeUntil,
  timeout
} from 'rxjs';
import { GROUP_ACTION } from '@/app/dashboard/modules/task-page/utils/constants';
import { EGroupAction } from '@/app/dashboard/modules/task-page/utils/enum';
import {
  IGetTaskByFolder,
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  EUpdateMultipleTaskAction,
  InboxToolbarService
} from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SocketType } from '@shared/enum/socket.enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { GroupType } from '@shared/enum/user.enum';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@/app/dashboard/services/user.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { TaskType } from '@shared/enum/task.enum';
import { isEqual } from 'lodash-es';
import { ShareValidators } from '@shared/validators/share-validator';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { ErrorMessages } from '@services/constants';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '@services/task.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ETypeMessage,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { SharedService } from '@services/shared.service';
import { TrudiConfirmService } from '@trudi-ui';
import { HeaderService } from '@services/header.service';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';
import { Store } from '@ngrx/store';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import {
  ITaskRow,
  ITaskViewSettingsStatus
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import {
  ListViewDraggableItem,
  TaskDragDropService
} from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';

export interface ITaskGroupAction {
  type: EGroupAction;
  taskGroupData?: IGetTaskByFolder;
}

interface ITaskGroupItem extends IGetTaskByFolder {
  disableDelete?: boolean;
}

@Component({
  selector: 'task-group',
  templateUrl: './task-group.component.html',
  styleUrls: ['./task-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskGroupComponent implements OnInit, OnDestroy, OnChanges {
  private readonly _inputTaskNameComponent$ =
    new BehaviorSubject<TrudiTextFieldComponent>(undefined);
  get inputTaskNameComponent() {
    return this._inputTaskNameComponent$.getValue();
  }
  @ViewChild('trudiTextField') set inputTaskNameComponent(
    value: TrudiTextFieldComponent
  ) {
    this._inputTaskNameComponent$.next(value);
  }
  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  disableDragging: boolean;
  @Input() set taskGroupData(value: ITaskGroupItem) {
    this._taskGroupData$.next(value);
  }
  get taskGroupData() {
    return this._taskGroupData$.getValue();
  }

  @Input() taskCompletedGroup: IGetTaskByFolder;
  @Input() hasFilter: boolean;
  @Input() taskViewSettings: ITaskViewSettingsStatus = null;
  @Input() innerWidth: number;
  @Output() changeTaskGroupAction = new EventEmitter<ITaskGroupAction>();
  @Output() taskDropped = new EventEmitter<CdkDragDrop<ITaskRow>>();
  @Output() addTask = new EventEmitter();
  @Output() taskDragStart = new EventEmitter<void>();
  @Output() handleChangeTitleTask = new EventEmitter();
  @Output() openDrawer = new EventEmitter<ITaskRow>();

  private readonly destroy$ = new Subject<void>();
  private readonly _taskGroupData$ = new BehaviorSubject<ITaskGroupItem>(
    {} as ITaskGroupItem
  );
  // if the group is open at least one time, we will not render the group content again
  private readonly _onOpenCount = new BehaviorSubject<number>(0);
  public readonly shouldRenderTaskRow$ = this._onOpenCount
    .asObservable()
    .pipe(map((count) => count > 0));

  public readonly taskGroupData$ = this._taskGroupData$.asObservable();

  public isSelectedMove: boolean;
  public isOpenTaskGroup: boolean = false;
  public taskName = new FormControl(null, [
    Validators.required,
    ShareValidators.trimValidator
  ]);
  readonly TaskType = TaskType;
  readonly MessageType = ETypeMessage;
  public isThreeDotVisible = false;
  public GROUP_ACTION = GROUP_ACTION;
  public editTaskGroupName = false;
  public set _editTaskGroupName(value: boolean) {
    value ? this.taskName.enable() : this.taskName.disable();
    this.editTaskGroupName = value;
  }
  public showColorPicker = false;
  public colorCode = '';
  public queryParams: Params;
  private currentUser: CurrentUser;
  public activeTaskList: string[] = [];
  public unreadTaskGroup: number = 0;
  public startIndex: number = -1;
  private currentMailboxId: string;
  private isSameFolder: boolean;
  public createNewConversationConfigs;
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public queryTaskId: string = '';
  public currentDraggingToFolderName: string = '';
  @ViewChild('infiniteScrollView')
  infiniteScrollView: ElementRef<HTMLElement>;
  private readonly defaultCreateNewConversationConfigs = {
    'header.title': 'Bulk send email',
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.receiver.isShowContactType': true,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.prefillReceivers': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.prefillReceiversList': [],
    'otherConfigs.isCreateMessageType': false,
    'header.icon': 'energy'
  };
  public isConsole: boolean;

  public selectedTasks: ITaskRow[] = [];
  public isTaskSelected = {};

  public get isFocusView(): boolean {
    return this.queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK;
  }

  constructor(
    private router: Router,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private taskGroupService: TaskGroupService,
    private dragService: TaskDragDropService,
    private websocketService: RxWebsocketService,
    private inboxToolbarService: InboxToolbarService,
    private sharedService: SharedService,
    public inboxService: InboxService,
    private toatrService: ToastrService,
    private taskService: TaskService,
    private toastCustomService: ToastCustomService,
    private taskApiService: TaskApiService,
    private trudiConfirmService: TrudiConfirmService,
    private headerService: HeaderService,
    private readonly store: Store,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private messageFlowService: MessageFlowService,
    private inboxExpandService: InboxExpandService,
    private syncTaskActivityService: SyncTaskActivityService
  ) {}

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

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.colorCode = this.taskGroupData?.taskGroup?.color;
    this.taskName.setValue(this.taskGroupData?.taskGroup?.name, {
      emitEvent: false
    });

    this.taskGroupService.expandedGroupIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe((idMap) => {
        const isOpen = idMap[this.taskGroupData?.taskGroup?.id];
        if (this.isOpenTaskGroup !== isOpen) {
          this.isOpenTaskGroup = isOpen;
        }
        this.updateOpenCount(this.isOpenTaskGroup);
      });

    if (this.isConsole) {
      this.disableDragging = true;
    } else {
      this.taskGroupService.isEditing$
        .pipe(takeUntil(this.destroy$))
        .subscribe((isEditing) => {
          this.disableDragging = isEditing;
        });
    }

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.queryParams = res;
        this.queryTaskId = res['taskId'];
      });

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.selectedTasks = rs as ITaskRow[];
        this.isSelectedMove = rs?.length > 0;
        this.isTaskSelected = this.inboxToolbarService.selectedItemsMap;
        this.changeDetectorRef.markForCheck();
        if (rs.length === 0) {
          this.handleRemoveActiveTask();
        }
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

    this.subscribeSocket();
    this.onSocketSeenTask();
    this.onSocketMoveMessage();
    this.subscribeSocketNewUnreadNote();
    this.subscribeConversationAction();
    this.editTaskGroupName ? this.taskName.enable() : this.taskName.disable();
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
        if (this.shouldHandleSchedule(task, taskGroup.name as TaskStatusType))
          return;
        this.handleMoveTasksToGroup(task, taskFolder, taskGroup);
        break;
      case ETaskMenuOption.SEND_MESSAGE:
        this.handleSendMessage(task);
        break;
      case ETaskMenuOption.RESOLVE:
        if (this.shouldHandleSchedule(task, TaskStatusType.completed)) return;
        this.handleAction(task, TaskStatusType.completed);
        break;
      case ETaskMenuOption.DELETE:
        if (this.shouldHandleSchedule(task, TaskStatusType.deleted)) return;
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

  handleMoveTasksToGroup(
    taskItem: ITaskRow,
    taskFolder: ITaskFolder,
    taskGroup: ITaskGroup
  ) {
    const { id: taskGroupId, isCompletedGroup } = taskGroup;
    const { id: taskFolderId, name: taskFolderName } = taskFolder;
    const taskId = taskItem.id;
    this.updateTasksMultiple([taskId], taskItem, {
      taskGroupId: taskGroupId,
      status: isCompletedGroup
        ? TaskStatusType.completed
        : TaskStatusType.inprogress,
      taskFolderId: taskFolderId,
      taskFolderName: taskFolderName,
      isCompletedGroup: isCompletedGroup
    });
  }

  updateTasksMultiple(
    taskIds: string[],
    task: ITaskRow,
    options: {
      taskGroupId?: string;
      status?: TaskStatusType;
      taskFolderId?: string;
      taskFolderName?: string;
      isCompletedGroup?: boolean;
    }
  ) {
    const {
      taskGroupId,
      status,
      taskFolderId,
      taskFolderName,
      isCompletedGroup
    } = options;
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
            this.updateTaskList(
              [task],
              taskFolderId,
              taskGroupId,
              isCompletedGroup
            );
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

  updateTaskList(
    tasks: ITaskRow[],
    taskFolderId: string,
    taskGroupId: string,
    isCompletedGroup?: boolean
  ) {
    this.isSameFolder =
      this.queryParams[ETaskQueryParams.TASKTYPEID] &&
      taskFolderId &&
      this.queryParams[ETaskQueryParams.TASKTYPEID] === taskFolderId;
    this.inboxToolbarService.updateTasks({
      action: this.isSameFolder
        ? EUpdateMultipleTaskAction.CHANGE_POSITION
        : EUpdateMultipleTaskAction.DELETE,
      payload: {
        tasks: tasks,
        targetId: taskGroupId,
        isCompletedGroup: isCompletedGroup
      }
    });
  }

  shouldHandleSchedule(task: ITaskRow, status: TaskStatusType) {
    if (
      [TaskStatusType.completed, TaskStatusType.deleted].includes(status) &&
      checkScheduleMsgCount(task.conversations)
    ) {
      this.errorMessage =
        status === TaskStatusType.completed
          ? ErrorMessages.RESOLVE_TASK
          : ErrorMessages.DELETE_TASK;
      this.isShowModalWarning = true;
      return true;
    }
    return false;
  }

  private handleSendMessage(task: ITaskRow) {
    this.createNewConversationConfigs = {
      ...this.defaultCreateNewConversationConfigs,
      'header.isChangeHeaderText': true,
      'body.receiver.isShowContactType': true,
      'body.prefillReceivers': false,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
      'body.prefillReceiversList': [],
      'otherConfigs.isCreateMessageType': false,
      'header.viewRecipients': true,
      'inputs.openFrom': TaskType.MESSAGE,
      'inputs.typeMessage': ETypeMessage.SCRATCH,
      'inputs.selectedTasksForPrefill': [
        {
          taskId: task.id,
          propertyId: task.property.id
        }
      ]
    };

    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            break;
          case ESendMessageModalOutput.MessageSent:
            this.handleClosePopOverAfterSend(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.handleCloseModalSendMsg();
            break;
        }
      });
  }

  handleClosePopOverAfterSend({ data, event }: ISendMsgTriggerEvent) {
    this.handleClearSelected();
    this.changeDetectorRef.markForCheck();
  }

  private handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  private handleAction(task: ITaskRow, status: TaskStatusType) {
    if (this.selectedTasks.length > 0) return;
    const taskId = task.id;
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
    //if mark as resolve, pass taskGroupId of completed group in current folder
    const currentFolderId = this.taskGroupData.taskGroup.taskFolderId;
    const completedGroupId = this.taskCompletedGroup[0]?.taskGroup?.id;
    this.updateTasksMultiple([taskId], task, {
      taskGroupId: completedGroupId,
      status: status,
      taskFolderId: currentFolderId,
      taskFolderName: null,
      isCompletedGroup: true
    });
  }

  handleConfirmPermanentlyDelete(task: ITaskRow) {
    const taskIds = [task.id];
    this.inboxToolbarService.setInboxItem([]);
    this.taskGroupService.setEditMode(true);
    this.taskApiService.permanentlyDeleteTasks(taskIds).subscribe({
      next: (res) => {
        const currentFolderId = this.taskGroupData.taskGroup.taskFolderId;
        this.updateTaskList([task], currentFolderId, null, null);
        this.toatrService.success(`1 task deleted`);
      },
      error: () => {
        this.toatrService.error(`Deleted failed`);
      },
      complete: () => {}
    });
  }

  handleCloseModalSendMsg() {
    this.changeDetectorRef.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskGroupData']?.currentValue) {
      this.GROUP_ACTION = this.GROUP_ACTION.map((action) => {
        switch (action.id) {
          case EGroupAction.ASSIGN_AS_DEFAULT_GROUP:
            return {
              ...action,
              disabled: this.taskGroupData.taskGroup.isDefault
            };
          case EGroupAction.DELETE_GROUP:
            return {
              ...action,
              disabled:
                !!this.taskGroupData.data.length ||
                this.taskGroupData.taskGroup.isDefault ||
                this.taskGroupData.disableDelete
            };
          case EGroupAction.CHANGE_GROUP_COLOR:
            return { ...action, color: this.taskGroupData.taskGroup.color };
          default:
            return action;
        }
      });
      this.handleUnreadTaskGroup();
    }
  }

  subscribeSocket() {
    this.websocketService.onSocketTask
      .pipe(
        takeUntil(this.destroy$),
        filter((data) => data && data.type),
        distinctUntilChanged()
      )
      .subscribe((data) => {
        switch (data.type) {
          case SocketType.newTask:
          case SocketType.messageToTask:
            this.handleRealtimeNewTask(data);
            break;
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

  private onSocketSeenTask() {
    // Note: handle unread conversation in task-group and hide auto-reopened badge
    this.websocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
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
            data: this.taskGroupData.data?.map((task: ITaskRow) => ({
              ...task
            }))
          };

          conversations.forEach((conversation) => {
            const findTaskIndex = updatedTaskGroupData.data?.findIndex(
              (it) => it.id === conversation.taskId
            );
            if (conversation.taskType === TaskType.TASK && findTaskIndex > -1) {
              updatedTaskGroupData.data = updatedTaskGroupData.data?.map(
                (task: ITaskRow) => {
                  if (task.id === conversation.taskId) {
                    const updateReadConversation = [
                      ...task.unreadConversations
                    ].filter((it) => it !== conversation.conversationId);
                    if (!isSeen) {
                      updateReadConversation.push(conversation.conversationId);
                    }
                    return {
                      ...task,
                      unreadConversations: updateReadConversation,
                      isAutoReopen: isSeen ? false : task.isAutoReopen
                    };
                  }
                  return task;
                }
              );
            }
          });

          this._taskGroupData$.next(updatedTaskGroupData);
        } else {
          const findTaskIndex = this.taskGroupData.data?.findIndex(
            (it) => it.id === taskId
          );
          if (taskType === TaskType.TASK && findTaskIndex > -1) {
            this._taskGroupData$.next({
              ...this.taskGroupData,
              data: this.taskGroupData.data?.map((task: ITaskRow) => {
                if (task.id === taskId) {
                  const updateReadConversation = [
                    ...task.unreadConversations
                  ].filter((it) => it !== conversationId);
                  if (!isSeen) {
                    updateReadConversation.push(conversationId);
                  }
                  return {
                    ...task,
                    unreadConversations: updateReadConversation,
                    isAutoReopen: isSeen ? false : task.isAutoReopen
                  };
                }
                return task;
              })
            });
          }
        }
        this.handleUnreadTaskGroup();
        this.updateTaskGroup();
      });
  }

  handleUnreadTaskGroup() {
    this.unreadTaskGroup = this.taskGroupData.data.reduce(
      (sum, cur) =>
        sum +
        (cur.unreadConversations?.length || 0) +
        (cur.internalNoteUnreadCount || 0),
      0
    );
    this.changeDetectorRef.markForCheck();
  }

  onSocketMoveMessage() {
    this.websocketService.onSocketUnreadConversationInTask
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this._taskGroupData$.next({
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
        });
        this.handleUnreadTaskGroup();
        this.updateTaskGroup();
      });
  }

  handleRealtimeNewTask(data) {
    if (
      !data.task ||
      data.task.taskGroupId !== this.taskGroupData.taskGroup.id ||
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      this.queryParams[EInboxFilterSelected.ASSIGNED_TO] ||
      this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]
    ) {
      return;
    }
    const {
      id,
      status,
      property,
      indexTitle,
      assignToAgents,
      calendarEvents,
      isExistInternalNote,
      isExistScheduledMessage,
      unreadConversations,
      createdAt,
      updatedAt
    } = data.task;

    const isMyTask = assignToAgents.some(
      (agent) => agent.id === this.currentUser.id
    );
    if (this.isFocusView !== isMyTask) {
      return;
    }

    this._taskGroupData$.next({
      ...this.taskGroupData,
      meta: {
        ...this.taskGroupData.meta,
        itemCount: Number(this.taskGroupData.meta) + 1
      },
      data: [
        {
          ...data.task,
          id,
          status,
          property,
          indexTitle,
          assignToAgents,
          calendarEvents,
          isExistInternalNote,
          isExistScheduledMessage,
          unreadConversations,
          createdAt,
          updatedAt,
          updatedAtOfTask: createdAt
        },
        ...this.taskGroupData.data
      ]
    });
    this.updateTaskGroup();
  }

  handleUpdateTaskRealtime(data) {
    if (data.taskGroupId !== this.taskGroupData.taskGroup.id) {
      return;
    }

    const isExistInList = this.taskGroupData.data.some(
      (task) => task.id === data.id
    );
    if (isExistInList) {
      const updatedData = this.taskGroupData.data.map((task) => {
        if (task.id === data.id) {
          return {
            ...task,
            indexTitle: data.title || task.indexTitle
          };
        }
        return task;
      });
      this._taskGroupData$.next({
        ...this.taskGroupData,
        data: updatedData
      });
    }
    this.updateTaskGroup();
  }

  handleUpdateAssignTaskRealtime(data) {
    if (
      this.isFocusView &&
      data.taskGroupId === this.taskGroupData.taskGroup.id
    ) {
      const isExistInList = this.taskGroupData.data.some(
        (task) => task.id === data.id
      );
      const isCurrentUserAssigned = data.assignToAgents.some(
        (agent) => agent.id === this.currentUser.id
      );
      if (isExistInList && !isCurrentUserAssigned) {
        this.removeTask(data.id);
      } else if (!isExistInList && isCurrentUserAssigned) {
        this.addTaskAfterAssignSocket(data);
      }
    }

    this.updateTaskAssignees(data);
    this.updateTaskGroup();
  }

  removeTask(taskId) {
    this.taskGroupData.data = this.taskGroupData.data.filter(
      (task) => task.id !== taskId
    );
    this.taskGroupData.meta.itemCount -= 1;
  }

  addTaskAfterAssignSocket(newTask) {
    const updatedTask = { ...newTask, updatedAtOfTask: newTask.updatedAt };
    const updatedTaskList = [...this.taskGroupData.data, updatedTask];
    this.taskGroupData.data = updatedTaskList.sort(
      (a, b) =>
        new Date(b.updatedAtOfTask).getTime() -
        new Date(a.updatedAtOfTask).getTime()
    );
    this.taskGroupData.meta.itemCount += 1;
  }

  updateTaskAssignees(updatedTask) {
    this._taskGroupData$.next({
      ...this.taskGroupData,
      data: this.taskGroupData.data.map((task) => {
        return task.id === updatedTask.id
          ? { ...task, assignToAgents: updatedTask.assignToAgents }
          : task;
      })
    });
  }

  handlePermanentlyDeleteTaskRealtime(data) {
    let filteredTasksCount = 0;

    const updatedData = this.taskGroupData.data.filter((item) => {
      if (!data.data?.taskIds?.some((taskId) => taskId === item.id)) {
        ++filteredTasksCount;
        return true;
      }
      return false;
    });
    const updatedMeta = {
      ...this.taskGroupData.meta,
      itemCount: Number(this.taskGroupData.meta) - filteredTasksCount
    };
    this._taskGroupData$.next({
      ...this.taskGroupData,
      data: updatedData,
      meta: updatedMeta
    });
    this.updateTaskGroup();
  }

  handleToggleExpandTaskGroup() {
    if (!this.taskGroupData.taskGroup.id) return;
    this.isOpenTaskGroup = !this.isOpenTaskGroup;
    this.updateOpenCount(this.isOpenTaskGroup);
    this.taskGroupService.toggleExpandGroup(this.taskGroupData.taskGroup.id);
  }

  public handleEditTaskName() {
    if (this.taskGroupService.isEditing) return;
    this._editTaskGroupName = !this.editTaskGroupName;
    this.changeDetectorRef.markForCheck();
    this.handleFocus();
  }

  public handleBlurTaskGroup() {
    this._editTaskGroupName = false;
    this.showColorPicker = false;
    if (this.taskName.invalid) {
      if (this.taskGroupData.taskGroup.id) {
        this.taskName.setValue(this.taskGroupData.taskGroup.name);
        this.taskGroupService.setEditMode(false);
      } else {
        this._editTaskGroupName = !this.editTaskGroupName;
        this.handleFocus();
      }
      return;
    }
    this.taskGroupService.setEditMode(false);
    this.changeDetectorRef.markForCheck();
    if (
      this.taskName.value === this.taskGroupData.taskGroup.name &&
      this.colorCode === this.taskGroupData.taskGroup.color &&
      this.taskGroupData.taskGroup.id
    ) {
      return;
    }
    this.submitTaskGroupData();
  }

  submitTaskGroupData() {
    let newTaskGroupData = {
      ...this.taskGroupData,
      taskGroup: {
        ...this.taskGroupData.taskGroup,
        name: this.taskName.value,
        color: this.colorCode
      }
    };

    this.changeTaskGroupAction.emit({
      type: EGroupAction.RENAME_GROUP,
      taskGroupData: {
        ...newTaskGroupData
      }
    });
  }

  public changeGroupColor(colorCode: string) {
    this.colorCode = colorCode;
  }

  public handleFocus() {
    setTimeout(() => {
      if (this.inputTaskNameComponent) {
        this.taskGroupService.setEditMode(true);
        this.inputTaskNameComponent?.inputElem?.nativeElement?.focus();
      }
    });
  }

  public handleFocusAfterAddNewGroup() {
    this._inputTaskNameComponent$
      .pipe(
        first(Boolean),
        timeout(3000),
        catchError(() => {
          this._editTaskGroupName = false;
          this.taskGroupService.setEditMode(false);
          return of(null);
        })
      )
      .subscribe((component) => {
        const element = component?.inputElem?.nativeElement;
        if (!element) return;
        this._editTaskGroupName = true;
        this.handleFocus();
        // if element is not in viewport, scroll to it
        if (element.getBoundingClientRect().bottom > window.innerHeight) {
          element.scrollIntoView();
        }
      });
  }

  trackTaskItem(_, item: ITaskRow) {
    return item.id;
  }

  public handleMenuAction(type) {
    switch (type) {
      case EGroupAction.COLLAPSE_ALL_GROUPS:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.COLLAPSE_ALL_GROUPS
        });
        break;
      case EGroupAction.EXPAND_ALL_GROUPS:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.EXPAND_ALL_GROUPS
        });
        break;
      case EGroupAction.ASSIGN_AS_DEFAULT_GROUP:
        const taskGroup = {
          ...this.taskGroupData.taskGroup,
          isDefault: true
        };
        this.changeTaskGroupAction.emit({
          type: EGroupAction.ASSIGN_AS_DEFAULT_GROUP,
          taskGroupData: { ...this.taskGroupData, taskGroup }
        });
        break;
      case EGroupAction.ADD_GROUP:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.ADD_GROUP
        });
        break;
      case EGroupAction.ADD_GROUP_ABOVE:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.ADD_GROUP_ABOVE,
          taskGroupData: this.taskGroupData
        });
        break;
      case EGroupAction.ADD_GROUP_BELOW:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.ADD_GROUP_BELOW,
          taskGroupData: this.taskGroupData
        });
        break;
      case EGroupAction.RENAME_GROUP:
        this._editTaskGroupName = true;
        this.handleFocus();
        break;
      case EGroupAction.CHANGE_GROUP_COLOR:
        this._editTaskGroupName = true;
        this.showColorPicker = true;
        this.handleFocus();
        break;
      case EGroupAction.DELETE_GROUP:
        this.changeTaskGroupAction.emit({
          type: EGroupAction.DELETE_GROUP,
          taskGroupData: this.taskGroupData
        });
        break;
      case EGroupAction.ADD_TASK:
        this.addTask.emit();
        break;
      default:
        break;
    }
  }

  public subscribeSocketNewUnreadNote() {
    this.websocketService.onSocketNewUnreadNoteData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this._taskGroupData$.next({
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
        });
        this.handleUnreadTaskGroup();
        this.updateTaskGroup();
      });
  }

  handleSelectedTasks(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.taskGroupData.data.findIndex(
        (item) => item.id === this.queryTaskId
      );
    }
    this.activeTaskList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeTaskList,
      this.taskGroupData?.data
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dragMoved(event: CdkDragMove<ITaskRow>) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);
    this.taskDragStart.emit();
    this.dragService.setDragInfo(
      event,
      ListViewDraggableItem.TASK_ROW,
      this.taskGroupData?.taskGroup?.id,
      this.inboxToolbarService.hasItem
    );
  }

  dragDropped(event) {
    this.inboxExpandService.handleCollapseFolder();
    this.taskDropped.emit(event);
  }

  triggerChangeTitleTask(value) {
    this.handleChangeTitleTask.emit(value);
  }

  updateTaskGroup() {
    this.store.dispatch(
      taskGroupActions.updateTaskGroup({
        taskGroup: this.taskGroupData,
        taskGroupId: this.taskGroupData.taskGroup.id
      })
    );
  }

  private updateOpenCount(value: boolean) {
    const currentCount = this._onOpenCount.getValue();
    if (value && currentCount === 0) {
      this._onOpenCount.next(currentCount + 1);
    }
  }

  handleScroll() {
    this.resetRightClickSelectedState();
  }
}
