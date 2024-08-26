import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@/app/services/user.service';
import { CompanyService } from '@/app/services/company.service';
import { ConversationService } from '@/app/services/conversation.service';
import { PropertiesService } from '@/app/services/properties.service';
import { SharedService } from '@/app/services/shared.service';
import { SyncTaskActivityService } from '@/app/services/sync-task-activity.service';
import { TaskService } from '@/app/services/task.service';
import {
  EDataE2ETaskDetail,
  GroupType,
  ISocketSyncTaskActivityToPT,
  ITaskGroupItem,
  SocketType,
  TaskItem,
  TaskStatusType,
  TaskType,
  UserPropertyInPeople
} from '@/app/shared';
import { EButtonTask, EButtonType, PreventButtonService } from '@trudi-ui';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  of,
  takeUntil
} from 'rxjs';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { HeaderService } from '@/app/services/header.service';
import { TrudiConfirmService } from '@trudi-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigatorService } from '@/app/services/navigator.service';
import { AppRoute } from '@/app/app.route';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import {
  removeSelectedSideNav,
  updateReturnUrlBasedOnTab
} from '@/app/task-detail/modules/header-left/utils/helper.funtion';
import { Store } from '@ngrx/store';
import { taskDetailActions } from '@/app/core/store/task-detail';
import { ErrorMessages } from '@/app/services';
import { UtilsService } from '@/app/dashboard/services/utils.service';

@Component({
  selector: 'header-container',
  templateUrl: './header-container.component.html',
  styleUrl: './header-container.component.scss'
})
export class HeaderContainerComponent implements OnInit, OnDestroy {
  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  private unsubscribe$ = new Subject<void>();
  private currentTask: TaskItem;
  private currentTaskGroup = '';
  public isConsole: boolean = this.sharedService.isConsoleUsers();
  public errorMessage = '';
  public isShowModalWarning = false;
  public isLoadingAction = false;
  public isShowMoveFolder = false;
  public isLoadingSkeleton = false;
  public isDisabledSyncActivity = false;
  public isThreeDotsMenuVisible = false;
  public isExportTaskActivityVisible = false;
  public isShowModalUpdateProperty = false;
  public isDisallowReassignProperty = false;
  public isPropertyUpdating = false;
  public warningChangeProperty = {
    msg: '',
    isShow: false
  };
  public disabledDownloadPDF: boolean = false;
  public isRmEnvironment: boolean = false;
  public isConnectNetwork = false;
  public TaskStatusType = TaskStatusType;
  public EButtonTask = EButtonTask;
  public EButtonType = EButtonType;
  public groupOrders: string[];
  public formSelectGroup: FormGroup;
  public formSelectProperty: FormGroup;
  public taskFolderGroups: Partial<ITaskGroupItem>[];
  public listPropertyAllStatus: UserPropertyInPeople[] = [];
  public listPropertyActive: UserPropertyInPeople[] = [];
  public TaskType = TaskType;
  private inboxItem: TaskItem[] | EmailItem[] | ITaskRow[] = [];
  public HEADER_RIGHT_CHANGE_STATUS_BUTTON = [
    {
      taskStatus: TaskStatusType.completed,
      icon: 'iconRotateV2',
      visible: false,
      action: () => {
        this.handleTaskStatus(TaskStatusType.inprogress);
      },
      tooltip: 'Re-open',
      dataE2e: 'task-details-reopen-button',
      buttonKey: EButtonTask.TASK_ACTION_REOPEN,
      name: 'Reopen task'
    },
    {
      taskStatus: TaskStatusType.inprogress,
      icon: 'iconCheckCircleV2',
      visible: false,
      dataE2e: 'task-details-mark-as-completed-button',
      action: () => {
        this.handleTaskStatus(TaskStatusType.completed);
      },
      tooltip: 'Mark as completed',
      buttonKey: EButtonTask.TASK_MARK_AS_RESOLVED,
      name: 'Complete task'
    }
  ];
  public fireworksTimeout: NodeJS.Timeout = null;

  constructor(
    private fb: FormBuilder,
    private readonly sharedService: SharedService,
    private taskService: TaskService,
    private taskApiService: TaskApiService,
    private conversationService: ConversationService,
    private toastCustomService: ToastCustomService,
    public toatrService: ToastrService,
    private inboxSidebarService: InboxSidebarService,
    private PreventButtonService: PreventButtonService,
    private syncTaskActivityService: SyncTaskActivityService,
    private agencyService: AgencyService,
    private companyService: CompanyService,
    private propertyService: PropertiesService,
    private utilsService: UtilsService,
    private userService: UserService,
    private inboxToolbarService: InboxToolbarService,
    private headerService: HeaderService,
    private trudiConfirmService: TrudiConfirmService,
    private router: Router,
    private route: ActivatedRoute,
    private navigatorService: NavigatorService,
    private inboxFilterService: InboxFilterService,
    private taskGroupService: TaskGroupService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.initFormSelectGroup();
    this.subscribeCurrentTask();
    this.subscribeTaskFolder();
    this.subscribeCurrentCompany();
    this.subscribeCurrentTaskActivity();
    this.subscribeListProperty();
    this.subscribeInboxItem();
    this.handleChangePropertyTask();
    this.subscribeTriggerDisallowReassignProperty();
    this.subscribeNetworkConnect();
  }

  private initFormSelectGroup() {
    this.formSelectGroup = this.fb.group({
      taskGroup: this.fb.control(null, [Validators.required])
    });

    this.formSelectProperty = this.fb.group({
      propertyId: this.fb.control(null)
    });
  }
  private subscribeCurrentTask() {
    this.isLoadingSkeleton = true;
    this.taskService.currentTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (res) {
          this.currentTask = res;
          this.currentTaskGroup = res.taskGroupId;
          this.HEADER_RIGHT_CHANGE_STATUS_BUTTON =
            this.HEADER_RIGHT_CHANGE_STATUS_BUTTON.map((button) => {
              return { ...button, visible: button.taskStatus === res.status };
            });
        }
        this.isLoadingSkeleton = false;
      });
  }

  private subscribeTaskFolder() {
    this.inboxSidebarService.taskFolders$
      .pipe(
        takeUntil(this.unsubscribe$),
        map((taskFolder) => {
          const sortTaskFolder = taskFolder.sort((a, b) =>
            a.order > b.order ? 1 : -1
          );
          this.groupOrders = sortTaskFolder.map((folder) => folder.id);
          return sortTaskFolder.flatMap((folder) =>
            folder.taskGroups
              ?.map((taskGroup) => ({
                ...taskGroup,
                icon: folder.icon,
                taskFolderId: folder.id,
                taskFolderName: folder.name
              }))
              .sort((a, b) => {
                if (a.isCompletedGroup && !b.isCompletedGroup) return 1;
                if (!a.isCompletedGroup && b.isCompletedGroup) return -1;
                return a.order > b.order ? 1 : -1;
              })
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          this.taskFolderGroups = res;
        }
      });
  }

  private subscribeCurrentTaskActivity() {
    this.taskService
      .getCurrentTaskActivity()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: ISocketSyncTaskActivityToPT) => {
        if (!res) return;
        const { taskIds, status } = res || {};
        const currentTaskId = this.taskService.currentTaskId$.getValue();
        if (taskIds.includes(currentTaskId)) {
          this.isDisabledSyncActivity = status === ESyncStatus.PENDING;
        }
      });
  }

  private subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((rs) => {
        if (rs) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(rs);
        }
      });
  }

  private subscribeListProperty() {
    this.propertyService.listPropertyAllStatus
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (res) this.listPropertyAllStatus = res;
      });
    this.propertyService.listPropertyActiveStatus
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (res) this.listPropertyActive = res;
      });
  }

  private subscribeInboxItem() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.inboxItem = res;
      });
  }

  private subscribeTriggerDisallowReassignProperty() {
    this.headerService.triggerDisallowReassignProperty$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        if (!res) return;
        this.isDisallowReassignProperty = res.isDisallowReassignProperty;
      });
  }

  private subscribeNetworkConnect() {
    merge(of(null), fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => (this.isConnectNetwork = status));
  }

  public saveTaskActivityToPT(downloadPDFFile = false) {
    if (this.isConsole) return;
    this.syncTaskActivityService.setListTasksActivity(
      this.currentTask ? [this.currentTask] : [],
      downloadPDFFile
    );
    this.isThreeDotsMenuVisible = false;
    this.isExportTaskActivityVisible = false;
  }

  private shouldHandleSchedule(status) {
    if (
      [TaskStatusType.completed, TaskStatusType.deleted].includes(status) &&
      this.checkCountScheduleMsgOfTask()
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

  public handleTaskStatus(taskStatus: TaskStatusType) {
    if (this.isConsole) {
      return;
    }
    if (this.shouldHandleSchedule(taskStatus)) return;

    switch (taskStatus) {
      case TaskStatusType.inprogress:
        this.reopenTask();
        break;
      case TaskStatusType.completed:
        this.changeTaskStatus();
        break;
      case TaskStatusType.deleted:
        this.permanentlyDelete();
        break;
      default:
        break;
    }
  }

  public customSearchFn(item: Partial<ITaskGroupItem>, searchTerm: string) {
    const searchByGroup = item?.name
      ?.toLowerCase()
      .includes(searchTerm?.trim().toLowerCase());
    const searchByFolder = item?.taskFolderName
      ?.toLowerCase()
      .includes(searchTerm?.trim().toLowerCase());

    return searchByGroup || searchByFolder;
  }

  public handleMoveToFolder() {
    if (this.formSelectGroup.invalid) {
      this.formSelectGroup.markAllAsTouched();
      return;
    }
    this.updateTaskStatus(this.formSelectGroup.get('taskGroup').value);
    this.isShowMoveFolder = false;
  }
  public onOpenPopupEditProperty() {
    if (this.isConsole || this.isDisallowReassignProperty) return;
    let propertyId = this.currentTask.property.id;
    if (
      this.checkIsHasPropertyOnDetail(propertyId, this.listPropertyAllStatus)
    ) {
      this.propertyIdFormControl.setValue(propertyId);
    }
    this.isShowModalUpdateProperty = true;
  }
  public handleConfirmUpdateProperty() {
    this.isPropertyUpdating = true;
    const { id, isTemporary } = this.currentTask?.property || {};
    const isSameProperty =
      this.propertyIdFormControl.value === id ||
      (!this.propertyIdFormControl.value && isTemporary) ||
      (!this.propertyIdFormControl.value &&
        !this.checkIsHasPropertyOnDetail(id, this.listPropertyAllStatus));
    if (isSameProperty) {
      this.isPropertyUpdating = false;
      this.isShowModalUpdateProperty = false;
      this.propertyIdFormControl.setValue(null);
      return;
    }

    const bodyChangetTaskProperty = {
      taskId: this.currentTask.id,
      newPropertyId: this.propertyIdFormControl.value
    };
    this.propertyService
      .updateTaskProperty(bodyChangetTaskProperty)
      .subscribe((res) => {
        if (res) {
          this.toatrService.success('The task property has been changed');
          this.updateCurrentTaskProperty(res.property);
          this.reLoadCurrentTaskWhenChangeProperty(res);
        }
        this.isPropertyUpdating = false;
        this.isShowModalUpdateProperty = false;
        this.propertyIdFormControl.setValue(null);
      });
  }
  public onCloseUpdatePropertyModal() {
    this.isShowModalUpdateProperty = false;
    this.propertyIdFormControl.setValue(null);
  }

  private permanentlyDelete() {
    if (this.isLoadingAction) return;
    this.isLoadingAction = true;
    const confirmModalConfig = {
      title: 'Are you sure you wish to delete this task?',
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
      hiddenCancelBtn: false,
      dataE2E: EDataE2ETaskDetail.DELETE_BUTTON
    };

    this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
      if (!res.result) {
        this.isLoadingAction = false;
        return;
      }

      this.taskApiService
        .permanentlyDeleteTasks([this.currentTask?.id])
        .subscribe({
          next: (res) => {
            this.toatrService.success(`Task deleted`);
            this.isLoadingAction = false;
            this.onBack();
          },
          error: () => {
            this.isLoadingAction = false;
          },
          complete: () => {
            this.isLoadingAction = false;
          }
        });
    });
  }

  private onBack(keepTaskId: boolean = false) {
    if (!this.isConnectNetwork) {
      this.router.navigate(['/no-internet']);
      return;
    }
    this.navigatorService.setReturnUrl(null);
    this.generateQueryParamFilter(keepTaskId);
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: this.currentTask.status.toLowerCase(),
      currentTask: null
    });
    if (this.currentTaskGroup)
      this.taskGroupService.keepExpandState$.next(true);
    this.taskGroupService.handleAddValueExpandGroup(this.currentTaskGroup);
  }

  private generateQueryParamFilter(keepTaskId: boolean) {
    combineLatest([
      this.inboxFilterService.selectedCalendarEventId$,
      this.inboxFilterService.selectedPortfolio$,
      this.inboxFilterService.selectedAgency$,
      this.inboxFilterService.selectedStatus$,
      this.inboxFilterService.searchDashboard$,
      this.inboxFilterService.selectedInboxType$,
      this.inboxFilterService.selectedTaskEditorId$,
      this.taskService.currentTask$,
      this.route.queryParams,
      this.inboxFilterService.selectedSortTaskType$,
      this.inboxFilterService.showMessageInTask$
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        ([
          selectedCalendarEventId,
          selectedPortfolio,
          selectedAgency,
          selectedStatus,
          searchValue,
          inboxType,
          selectedTaskEditorId,
          currentTask,
          queryParam,
          sortTaskType,
          showMessageInTask
        ]) => {
          if (currentTask && currentTask?.taskType) {
            let queryParams = {};
            if (searchValue) {
              queryParams = {
                ...queryParams,
                search: searchValue
              };
            }
            if (selectedAgency?.length) {
              queryParams = {
                ...queryParams,
                assignedTo: selectedAgency
              };
            }
            if (selectedPortfolio?.length) {
              queryParams = {
                ...queryParams,
                propertyManagerId: selectedPortfolio
              };
            }
            if (selectedStatus?.length) {
              queryParams = {
                ...queryParams,
                messageStatus: selectedStatus
              };
            }
            if (
              selectedCalendarEventId?.eventType?.length > 0 ||
              selectedCalendarEventId?.endDate ||
              selectedCalendarEventId?.startDate
            ) {
              queryParams = {
                ...queryParams,
                ...(selectedCalendarEventId?.eventType?.length > 0 && {
                  eventType: selectedCalendarEventId?.eventType
                }),
                ...(selectedCalendarEventId?.startDate && {
                  startDate: selectedCalendarEventId?.startDate
                }),
                ...(selectedCalendarEventId?.endDate && {
                  endDate: selectedCalendarEventId?.endDate
                })
              };
            }
            if (selectedTaskEditorId?.length) {
              queryParams = {
                ...queryParams,
                taskEditorId: selectedTaskEditorId
              };
            }
            const hasSortTaskType =
              queryParam?.['sortTaskType'] || sortTaskType;
            if (hasSortTaskType) {
              queryParams = {
                ...queryParams,
                sortTaskType: queryParam?.['sortTaskType'] || sortTaskType
              };
            }
            if (showMessageInTask) {
              queryParams = {
                ...queryParams,
                showMessageInTask: showMessageInTask
              };
            }
            if (currentTask.taskType === TaskType.MESSAGE) {
              queryParams = {
                ...queryParams,
                inboxType: inboxType,
                status:
                  currentTask.status === TaskStatusType.unassigned
                    ? TaskStatusType.inprogress
                    : currentTask.status
              };
            } else {
              const ignoreTaskId =
                inboxType === GroupType.MY_TASK &&
                !this.taskService.currentTask$?.value?.assignToAgents?.some(
                  (user) =>
                    user.id === this.userService.selectedUser.getValue()?.id
                );
              queryParams = {
                ...queryParams,
                taskId:
                  ignoreTaskId || !keepTaskId ? null : this.currentTask?.id,
                inboxType: inboxType,
                taskTypeID: currentTask.taskFolderId
              };
            }
            if (queryParam['mailBoxId']) {
              queryParams = {
                ...queryParams,
                mailBoxId: queryParam['mailBoxId']
              };
            }
            this.router.navigate(['/dashboard/tasks'], {
              queryParams,
              relativeTo: this.route
            });

            if (
              this.router.url.includes('reminderType') &&
              !!queryParam['reminderType']
            ) {
              if (queryParam['reminderType']) {
                queryParams = {
                  ...queryParams,
                  reminderType: queryParam['reminderType'],
                  taskId: null,
                  taskTypeID: null
                };
              }
              this.router.navigate([AppRoute.MESSAGE_INDEX], {
                queryParams,
                relativeTo: this.route
              });
            }
          }
        }
      );
  }
  private handleChangePropertyTask() {
    this.propertyIdFormControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((currentPropertyId) => {
        const { property, taskType, conversations } =
          this.taskService.currentTask$?.value || {};
        this.warningChangeProperty.isShow =
          taskType === TaskType.TASK &&
          !!currentPropertyId &&
          currentPropertyId !== property?.id &&
          conversations?.length > 0;
        const taskProperty =
          taskType === TaskType.MESSAGE
            ? this.checkIsHasPropertyOnDetail(
                currentPropertyId,
                this.listPropertyAllStatus
              )
            : this.checkIsHasPropertyOnDetail(
                currentPropertyId,
                this.listPropertyActive
              );

        this.warningChangeProperty.msg = `All messages in tasks will be assigned to ${taskProperty?.shortenStreetline}`;
      });
  }
  private updateCurrentTaskProperty(property: UserPropertyInPeople | any) {
    this.taskService.currentTask$.next({
      ...this.currentTask,
      agencyId: property.agencyId,
      companyId: property.companyId,
      property
    });
    this.propertyService.currentPropertyId.next(property?.id);
  }
  private reLoadCurrentTaskWhenChangeProperty(data) {
    this.updateCurrentTaskAssignees();
    this.updateToolbarWithCurrentTask(data);
    this.conversationService.reloadConversationList.next(true);
    this.store.dispatch(
      taskDetailActions.getListSteps({
        taskId: this.taskService.currentTask$.value.id
      })
    );
  }
  private updateCurrentTaskAssignees() {
    if (!this.currentTask) return;
    const { firstName, lastName, id, googleAvatar } =
      this.userService.getUserInfo() || {};
    const assigneeIds = this.currentTask.assignToAgents.map(
      (agent) => agent.id
    );
    if (!assigneeIds.includes(id)) {
      this.taskService.currentTask$.next({
        ...this.currentTask,
        assignToAgents: [
          ...this.currentTask.assignToAgents,
          { id, firstName, lastName, googleAvatar }
        ]
      });
    }
  }
  private updateToolbarWithCurrentTask(currentProperty) {
    if (!this.inboxItem.length || !currentProperty || !this.currentTask) return;

    const index = this.inboxItem.findIndex(
      (item) => item.id === this.currentTask.id
    );

    if (index !== -1) {
      this.inboxItem[index]['property'] = currentProperty;
    }

    this.inboxToolbarService.setInboxItem(this.inboxItem);
  }
  private checkIsHasPropertyOnDetail(propertyId: string, listProperty) {
    return listProperty.find((item) => item.id === propertyId);
  }
  private updateTaskStatus(targetTaskGroupId: string) {
    const folder = this.taskFolderGroups.find(
      (item) => item.id === targetTaskGroupId
    );
    if (
      (folder.name === TaskStatusType.completed &&
        !this.shouldHandleProcess()) ||
      (folder.name === TaskStatusType.deleted && !this.shouldHandleProcess())
    ) {
      return;
    }

    if (this.shouldHandleSchedule(folder.name)) return;
    this.moveTaskToGroup(targetTaskGroupId);
  }
  private moveTaskToGroup(targetTaskGroupId: string) {
    if (targetTaskGroupId === this.currentTaskGroup) return;
    this.isLoadingAction = true;
    const currentTaskFolder = this.taskFolderGroups.find(
      (f) => f.id === this.currentTaskGroup
    );
    const selectedTaskGroup = this.taskFolderGroups.find(
      (taskGroup) => taskGroup.id === targetTaskGroupId
    );
    const status = selectedTaskGroup.isCompletedGroup
      ? TaskStatusType.completed
      : TaskStatusType.inprogress;
    this.taskService
      .updateTask({
        mailBoxId: this.currentTask.mailBoxId,
        taskGroupId: targetTaskGroupId,
        status,
        taskIds: [this.currentTask.id]
      })
      .subscribe({
        next: (rs) => {
          const isMoveToCurrentFolder =
            currentTaskFolder.taskFolderId === selectedTaskGroup.taskFolderId;

          if (!isMoveToCurrentFolder) {
            this.toatrService.success(
              `Task moved to ${selectedTaskGroup?.taskFolderName}`
            );
          }

          const currentTask = {
            ...this.taskService.currentTask$.value,
            taskFolderId: selectedTaskGroup.taskFolderId,
            taskGroupId: selectedTaskGroup.id,
            status,
            updatedAt: new Date().toISOString()
          };
          this.isLoadingAction = false;
          this.taskService.currentTask$.next(currentTask);
        },
        error: () => {
          this.isLoadingAction = false;
        },
        complete: () => {
          this.isLoadingAction = false;
        }
      });
  }
  private shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonTask.TASK_UPDATE_STATUS_FOLDER,
      EButtonType.TASK
    );
  }
  private reopenTask() {
    this.taskApiService
      .getPreviousTaskFolder(this.currentTask.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res: ITaskFolder) => {
        if (res) {
          const [previousGroup] = res.taskGroups;
          if (previousGroup.id) {
            this.formSelectGroup.patchValue({ taskGroup: previousGroup.id });
          }
        }
      })
      .add(() => (this.isShowMoveFolder = true));
  }

  private changeTaskStatus() {
    if (this.isLoadingAction) return;
    this.isLoadingAction = true;

    const currentTaskFolderId = this.taskFolderGroups.find(
      (folder) => folder.id === this.currentTaskGroup
    )?.taskFolderId;

    const completedGroupId = this.taskFolderGroups.find(
      (group) =>
        group.taskFolderId === currentTaskFolderId && group.isCompletedGroup
    )?.id;

    this.taskService
      .updateTask({
        mailBoxId: this.currentTask.mailBoxId,
        status: TaskStatusType.completed,
        taskGroupId: completedGroupId,
        taskIds: [this.currentTask.id]
      })
      .subscribe({
        next: (rs) => {
          this.fireworksTimeout =
            this.utilsService.openFireworksByQuerySelector(
              '#action-button-change-status',
              1000,
              () => {
                this.onBack();
                this.isLoadingAction = false;
                this.taskService.reloadTaskDetail.next(true);
              }
            );

          const dataForToast = {
            taskId: this.currentTask.id,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: this.currentTask.mailBoxId,
            taskType: TaskType.TASK,
            status: TaskStatusType.completed,
            pushToAssignedUserIds: []
          };

          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );

          this.currentTaskGroup = completedGroupId;
          this.onBack(true);
        },
        error: () => {
          this.isLoadingAction = false;
        },
        complete: () => {
          this.isLoadingAction = false;
        }
      });
  }

  private checkCountScheduleMsgOfTask() {
    return checkScheduleMsgCount(
      this.conversationService.listConversationByTask.value
    );
  }

  get propertyIdFormControl() {
    return this.formSelectProperty.get('propertyId');
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    clearTimeout(this.fireworksTimeout);
  }
}
