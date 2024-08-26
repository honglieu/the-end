import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { ITaskGroup } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { DEBOUNCE_SOCKET_TIME } from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';
import { HeaderService } from '@/app/services/header.service';
import { MessageService } from '@/app/services/message.service';
import { NavigatorService } from '@/app/services/navigator.service';
import { NotificationService } from '@/app/services/notification.service';
import { PropertiesService } from '@/app/services/properties.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { SharedService } from '@/app/services/shared.service';
import { TaskService } from '@/app/services/task.service';
import { UserService } from '@/app/services/user.service';
import { AssignAttachBoxComponent } from '@shared/components/assign-attach-box/assign-attach-box.component';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SocketType } from '@shared/enum/socket.enum';
import {
  TaskStatusType,
  TaskStatusTypeLC,
  TaskType
} from '@shared/enum/task.enum';
import {
  EPropertyStatus,
  EUserPropertyType,
  GroupType
} from '@shared/enum/user.enum';
import {
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { listCategoryInterface } from '@shared/types/property.interface';
import {
  TaskDataPayloadChangeStatus,
  TaskItem,
  TaskItemDropdown,
  TaskName,
  TaskNameItem
} from '@shared/types/task.interface';
import { ETypePage } from '@/app/user/utils/user.enum';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EditTitleComponent } from './components/edit-title/edit-title.component';
import { CompanyService } from '@services/company.service';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { AppRoute } from '@/app/app.route';
import { TIME_NOW } from '@/app/dashboard/utils/constants';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import {
  removeSelectedSideNav,
  updateReturnUrlBasedOnTab
} from '@/app/task-detail/modules/header-left/utils/helper.funtion';
import { ICurrentUser } from '@/app/shared';

const STREETLINE_MAX_LENGTH_PER_LINE = 42;

interface ITaskGroupItem extends ITaskGroup {
  taskFolderName: string;
}

@Component({
  selector: 'header-left',
  templateUrl: './header-left.component.html',
  styleUrls: ['./header-left.component.scss']
})
@DestroyDecorator
export class HeaderLeftComponent implements OnInit, OnDestroy {
  @ViewChild('folderName') folderNameRef!: ElementRef;
  @ViewChild('groupName') groupNameRef!: ElementRef;
  @ViewChild('permanentlyDeleteConfirmModalContent')
  permanentlyDeleteConfirmModalContent: TemplateRef<HTMLElement>;
  @ViewChild(EditTitleComponent)
  editTitleComponent: EditTitleComponent;
  @Input() taskMsgDetail: TaskItem;
  @Input() task: TaskItem;
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Output() triggerUpdateDetail = new EventEmitter<boolean>();
  @Output() toggleSidebarRight = new EventEmitter<boolean>();
  isDropdownMenuOpen = false;
  @Input() conversation: UserConversation;
  @Input() isDraftFolder: boolean;
  @ViewChild('assignAttachBox') assignAttachBox: AssignAttachBoxComponent;
  @ViewChild('editIconEl') editIconEl: ElementRef<HTMLElement>;
  public listOfConversations: PreviewConversation[];
  public isNoProperty: boolean = false;
  public TaskStatusType = TaskStatusType;
  public typeTrudi: string;
  public isDetailSection: boolean = false;
  public taskType = '';
  public TaskTypeEnum = TaskType;
  public unsubscribe = new Subject<void>();
  newTaskPopupState = false;
  title = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(?!^\s+$)^[\s\S]*$/)
  ]);
  currentStatus: string;
  currentTask: TaskItem;
  currentTaskDeleted = false;
  taskNameCreateForm: FormGroup;
  isShowQuitConfirmModal = false;
  selectedTask: TaskItemDropdown;
  taskNameList: TaskItemDropdown[] = [];
  selectTopicItems: TaskNameItem[] = [];
  TaskStatusTypeLC = TaskStatusTypeLC;
  public showBtnNewMessage: boolean = false;
  TaskType = TaskType;
  public location = window.location;
  showBtnNewTask: boolean;
  waitToSetValue1: NodeJS.Timeout;
  public isShowMoveConversation: boolean;
  public isDetailPage: boolean;
  public isTeamPage: boolean = false;
  currentUser$: BehaviorSubject<ICurrentUser> = this.userService.selectedUser;
  isShowModalPeople: boolean = false;
  isShowModalAddNote: boolean = false;
  isExpandProperty: boolean = true;
  assignAttachBoxState = false;
  selectingUserIdListInTask: string[];
  currentAssignButton: HTMLElement;
  currentAssignButtonId = '';
  public listCategory: listCategoryInterface[] = [];
  attachBoxPosition = { left: 0, top: 0, bottom: 0 };
  currentAgencyId: string;
  public currentConversation;
  public status = '';
  public dataSelectMessage: string[] = [
    TaskStatusTypeLC.open,
    TaskStatusTypeLC.resolved,
    TaskStatusTypeLC.deleted
  ];
  public dataSelectTask: string[] = [
    TaskStatusTypeLC.inprogress,
    TaskStatusTypeLC.completed,
    TaskStatusTypeLC.cancelled
  ];
  public showPopup: boolean = false;
  public message: TaskItem;
  public isUnassignedMessageAdded: boolean = false;
  public isEditTitle: boolean = false;
  public isTaskRoute: boolean = false;
  public titleBeforeChange: string = '';
  public isLoadingSkeleton: boolean = true;
  private originalDataSelectMessage: string[] = [...this.dataSelectMessage];
  private originalDataSelectTask: string[] = [...this.dataSelectTask];
  public isArchiveMailbox: boolean = false;
  public isShowPersonMd = false;
  public currentPropertyId: string = '';
  public toolTipProperty: string;
  public streetProperty: string;
  public currentTaskType: TaskType;
  public crmSystemId;
  public isConnectNetwork: boolean = false;
  private windowHandlerClick: () => void;
  public propertyStatus: EPropertyStatus;
  public readonly EPropertyStatus = EPropertyStatus;
  public taskFolderGroups: Partial<ITaskGroupItem>[];
  public taskGroup: string = '';
  EViewDetailMode = EViewDetailMode;
  public isConsole: boolean = this.sharedService.isConsoleUsers();
  public isShowMoveFolder: boolean = false;
  public currentTaskGroupId: string = '';
  public taskFolders = [];
  public taskGroups = [];
  public isBlockEvent: boolean = false;
  private inboxItem: TaskItem[] | EmailItem[] | ITaskRow[] = [];
  public isLoadingAction = false;
  public fireworksTimeout: NodeJS.Timeout = null;
  public TIME_NOW = TIME_NOW;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public isRequestShowUserInfoFromTaskConversation: boolean = false;
  public isLoadingMessage: boolean = true;
  public visiblePropertyProfile = false;
  public isLoadingDetailHeader: boolean = false;

  constructor(
    public taskService: TaskService,
    public notificationService: NotificationService,
    public toatrService: ToastrService,
    public readonly sharedService: SharedService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private websocketService: RxWebsocketService,
    private navigatorService: NavigatorService,
    private propertyService: PropertiesService,
    private inboxFilterService: InboxFilterService,
    private inboxService: InboxService,
    private readonly elr: ElementRef,
    private readonly rd2: Renderer2,
    private inboxSidebarService: InboxSidebarService,
    private toastCustomService: ToastCustomService,
    private taskGroupService: TaskGroupService,
    private inboxToolbarService: InboxToolbarService,
    private companyService: CompanyService,
    public messageLoadingService: MessageLoadingService,
    private PreventButtonService: PreventButtonService,
    private userProfileDrawerService: UserProfileDrawerService
  ) {}

  get isCanEditTask() {
    return this.isTaskRoute && !this.isConsole && !this.isArchiveMailbox;
  }

  ngOnInit(): void {
    this.messageLoadingService.isLoading$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isLoading) => (this.isLoadingMessage = isLoading));
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox: boolean) =>
          (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.isDetailSection = true;
    this.getHeaderState();
    this.showBtnNewMessage =
      !(this.route.snapshot.queryParamMap['type'] === TaskType.MESSAGE) &&
      window.location.href.includes('messages') &&
      !window.location.href.includes('app-messages');
    this.showBtnNewTask =
      !(this.route.snapshot.queryParamMap['type'] === TaskType.TASK) &&
      window.location.href.includes('tasks');
    this.isDetailPage = window.location.href.includes('detail');
    this.isTeamPage = window.location.href.includes('settings/team');
    this.subscribeRouterEvent();
    this.router.setUpLocationChangeListener();
    this.subscribeToSocketTaskChanges();
    this.initForm();
    this.handleWindowClickEvent();
    this.getCurrentCompany();
    this.subscribeNetworkConnect();

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (!value) return;
        this.currentConversation = value;
        this.sharedService.setLoadingDetailHeader(false);
        this.propertyStatus = this.currentConversation?.propertyStatus;
      });

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.inboxItem = res;
      });

    this.messageService.requestShowUserInfo
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.isRequestShowUserInfoFromTaskConversation =
          res.isFromTaskCoversation;
        this.showModalPeople();
        this.messageService.requestShowUserInfo.next(null);
      });
    this.propertyService.currentPropertyId
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentPropertyId = res;
      });
    this.subscribeLoadingDetailHeader();
    combineLatest([
      this.taskService.currentTask$,
      this.conversationService.currentConversation
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedTask, selectedCurrentConversation]) => {
        if (!selectedTask?.property) return;
        const { taskType, property, agencyId } = selectedTask || {};
        const { propertyType } = selectedCurrentConversation || {};
        this.currentAgencyId = agencyId;
        this.currentTaskType = taskType;
        this.isNoProperty =
          [
            EUserPropertyType.SUPPLIER,
            EUserPropertyType.OTHER,
            EUserPropertyType.LANDLORD_PROSPECT,
            EUserPropertyType.TENANT_PROSPECT,
            EUserPropertyType.OWNER_PROSPECT
          ].includes(propertyType) && taskType === TaskType.MESSAGE;
        this.streetProperty = this.propertyService.getAddressProperty(
          property,
          propertyType,
          taskType
        );
        const { status, propertyType: type } = property || {};
        this.toolTipProperty = this.propertyService.getTooltipPropertyStatus({
          propertyStatus: status,
          type
        });
      });

    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((rs) => !!rs && rs.taskType === TaskType.TASK),
        tap((rs) => {
          this.taskType = rs?.taskType;
          if (rs) {
            this.isLoadingSkeleton = false;
          }
        }),
        switchMap((rs) => {
          this.currentTaskGroupId = rs?.taskGroupId;
          return this.inboxSidebarService.taskFolders$.pipe(
            takeUntil(this.unsubscribe),
            map((res) => ({ taskFolders: res, rs }))
          );
        })
      )
      .subscribe(({ taskFolders, rs }) => {
        this.taskFolders = taskFolders;
        let folders = (taskFolders || []).sort((a, b) =>
          a.order > b.order ? 1 : -1
        );

        this.taskFolderGroups = folders.flatMap((folder) =>
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
      });

    this.subscribeToMoveTaskEvent();
    this.subscribeSocketTaskGroup();
  }

  subscribeLoadingDetailHeader() {
    this.sharedService.getLoadingDetailHeader().subscribe((res) => {
      this.isLoadingDetailHeader = res;
    });
  }

  subscribeToMoveTaskEvent() {
    this.websocketService.onSocketMoTaskToGroup
      .pipe(debounceTime(DEBOUNCE_SOCKET_TIME), takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        const fromUserId = rs?.fromUserId || (rs?.data as any)?.fromUserId;
        if (fromUserId === this.currentUser$.value?.id) return;

        const { tasks, taskGroup } = (rs.data as any)?.data || rs.data || {};
        const existTask = (tasks || []).find(
          (task) => task.id === this.currentTask.id
        );
        if (existTask) {
          this.taskService.currentTask$.next({
            ...this.taskService.currentTask$.value,
            taskFolderId: taskGroup.taskFolderId,
            taskGroupId: taskGroup?.id,
            status: existTask.status
          });
        }
      });
  }

  subscribeSocketTaskGroup() {
    this.websocketService.onSocketTaskGroup
      .pipe(
        takeUntil(this.unsubscribe),
        filter((data) =>
          Boolean(
            data && data.type && data.mailBoxId === this.currentTask.mailBoxId
          )
        )
      )
      .subscribe((data) => {
        switch (data.type) {
          case SocketType.createdTaskGroup:
            this.handleCreatedGroupRealtime(data);
            break;
          case SocketType.updatedTaskGroup:
            this.handleUpdatedGroupRealtime(data);
            break;
          case SocketType.deletedTaskGroup:
            this.handleDeletedGroupRealtime(data);
            break;
        }
        this.inboxSidebarService.setInboxTaskFolder(this.taskFolders);
      });
  }

  handleCreatedGroupRealtime(data) {
    const {
      color,
      id,
      isDefault,
      name,
      order,
      taskFolderId,
      isCompletedGroup
    } = data.data;
    const taskGroup = {
      color,
      id,
      isDefault,
      name,
      order,
      taskFolderId,
      isCompletedGroup
    };
    const taskFolderIndex = this.taskFolders.findIndex(
      (f) => f.id === taskGroup.taskFolderId
    );
    if (taskFolderIndex !== -1) {
      this.taskFolders[taskFolderIndex].taskGroups.push(taskGroup);
    }
  }

  handleUpdatedGroupRealtime(data) {
    const { id, taskFolderId } = data.data[0];
    const taskFolderIndex = this.taskFolders.findIndex(
      (f) => f.id === taskFolderId
    );
    this.taskGroups = data.data.map((newGroup) => {
      const oldGroup = this.taskFolderGroups.find(
        (item) => item.id === newGroup.id
      );
      return {
        ...oldGroup,
        ...newGroup
      };
    });

    if (data.data.length === 1) {
      const updatedTaskGroup = data.data[0];
      if (taskFolderIndex !== -1) {
        this.taskFolders[taskFolderIndex].taskGroups = this.taskFolders[
          taskFolderIndex
        ].taskGroups.map((g) =>
          g.id === id ? { ...g, ...updatedTaskGroup } : g
        );
      }
    }
    if (data.data.length > 1) {
      // Updated group order
      const newOrderedGroups = data.data;
      // Create a map to store order values for each groupId
      const orderMap = newOrderedGroups.reduce((map, group) => {
        map[group.id] = group.order;
        return map;
      }, {});
      // Check if the newOrderedGroups have the same length and every item is present in this.taskGroups
      const isSameLengthAndContainsAll =
        newOrderedGroups.length === this.taskGroups.length &&
        newOrderedGroups.every((item) =>
          this.taskGroups.some((group) => group.id === item.id)
        );
      if (isSameLengthAndContainsAll) {
        this.taskGroups = this.taskGroups.map((item) => ({
          ...item,
          order: orderMap[item.id]
        }));

        this.taskFolders[taskFolderIndex].taskGroups = this.taskGroups;
      }
    }
  }

  handleDeletedGroupRealtime(data) {
    const { id, taskFolderId } = data.data;
    const taskFolderIndex = this.taskFolders.findIndex(
      (f) => f.id === taskFolderId
    );
    if (taskFolderIndex !== -1) {
      this.taskFolders[taskFolderIndex].taskGroups = this.taskFolders[
        taskFolderIndex
      ].taskGroups.filter((g) => g.id !== id);
    }
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonTask.TASK_UPDATE_STATUS_FOLDER,
      EButtonType.TASK
    );
  }

  showModalPeople() {
    let isExistedStreetLine;
    const { shortenStreetline, streetline } =
      this.taskService.currentTask$?.getValue()?.property || {};
    switch (this.crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        isExistedStreetLine = shortenStreetline;
        break;
      case ECrmSystemId.RENT_MANAGER:
        isExistedStreetLine = streetline;
        break;
      default:
        break;
    }
    if (isExistedStreetLine !== '') {
      this.isShowModalPeople = true;
      this.isShowPersonMd = true;
    }
  }

  handleWindowClickEvent() {
    this.windowHandlerClick = this.rd2.listen('window', 'click', (e: Event) => {
      if (
        (!this.currentAssignButton?.contains(e.target as Node) &&
          !this.assignAttachBox?.['elr']?.nativeElement?.contains(
            e.target as Node
          )) ||
        this.editIconEl?.nativeElement?.contains(e.target as Node)
      ) {
        this.assignAttachBoxState = false;
      } else {
        if (this.currentAssignButtonId !== this.currentAssignButton.id) {
          const token = this.currentAssignButton.getBoundingClientRect();
          const currentTask = this.taskService.currentTask$.value;
          this.assignAttachBoxState = true;
          this.attachBoxPosition = {
            left: token.left + 20,
            top:
              token.top +
              (currentTask.property?.streetline.length >
              STREETLINE_MAX_LENGTH_PER_LINE
                ? 148
                : 134),
            bottom: 0
          };
        }
        this.currentAssignButtonId = this.currentAssignButton.id;
      }
    });
  }

  toggleActiveClassToSideNavItem() {
    const iconList = document.getElementsByClassName('inbox-sub-item');
    if (
      iconList.length &&
      this.router.url.includes('detail') &&
      this.currentTask
    ) {
      const navItemIndex =
        this.currentTask.taskType === TaskType.MESSAGE ? 0 : 1;
      const selectedNavItem = iconList[navItemIndex];
      const unSelectedNavItem = iconList[navItemIndex ^ 1];
      selectedNavItem.classList.add('nav-item--selected');
      unSelectedNavItem.classList.remove('nav-item--selected');
    }
  }

  ngOnDestroy(): void {
    this.windowHandlerClick();
    this.clearAllOfTimer();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  clearAllOfTimer() {
    clearTimeout(this.waitToSetValue1);
    clearTimeout(this.fireworksTimeout);
  }

  initForm() {
    this.taskNameCreateForm = new FormGroup({
      taskName: new FormControl('', Validators.required),
      topicId: new FormControl('', Validators.required)
    });
  }

  get getTaskNameOnCreate() {
    return this.taskNameCreateForm.get('taskName').value;
  }

  get getTopicIdOnCreate() {
    return this.taskNameCreateForm.get('topicId').value;
  }

  get taskTitle() {
    return this.title?.value.trim();
  }

  onEditTitle(event: Event) {
    if (this.isArchiveMailbox) return;
    this.titleBeforeChange = this.title.value;
    this.isEditTitle = true;
    if (this.editTitleComponent) {
      this.editTitleComponent.focusInput();
    }
  }

  saveEditTitle(e) {
    if (!this.taskTitle) {
      this.cancelEditTitle();
      return;
    }
    this.isBlockEvent = true;
    this.isEditTitle = false;
    this.taskService
      .updateTaskTitle(
        this.headerService.headerState$?.value?.currentTask?.id,
        this.taskTitle,
        this.taskTitle
      )
      .subscribe((res) => {
        if (res) {
          const task = this.taskService.currentTask$.getValue();

          this.title.setValue(this.taskTitle);
          this.taskService.currentTask$.next({
            ...this.taskService.currentTask$.getValue(),
            title: this.title?.value,
            indexTitle: this.title?.value,
            conversations: task.conversations.map((cov, index) =>
              index === 0
                ? {
                    ...cov,
                    categoryName: this.title?.value
                  }
                : cov
            )
          });
          this.isBlockEvent = false;
        }
      });
  }

  cancelEditTitle() {
    this.title.setValue(this.titleBeforeChange);
    this.isEditTitle = false;
  }

  addNewCreatedTaskNameToList(data: TaskName) {
    this.taskNameList = [
      ...this.taskNameList,
      {
        label: data.name,
        value: {
          titleName: data.name,
          topicId: data.topicId
        },
        group: this.findGroupName(data.topicId),
        disabled: !data.isEnable
      }
    ];
  }

  findGroupName(topicId: string): string {
    return this.selectTopicItems.find((el) => el.id === topicId)?.name;
  }

  /**
   * Handle navigate to previous page when have event as click back button, change task status
   * @param keepTaskId With a value of true when navigating to the task list, the current task will be automatically focused
   * @returns
   */
  onBack(keepTaskId: boolean = false) {
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
    if (!this.isConnectNetwork) {
      this.router.navigate(['/no-internet']);
      return;
    }
    let returnUrl = this.navigatorService.getReturnUrl();
    this.navigatorService.setReturnUrl(null);
    if (returnUrl) {
      const tab = this.route.snapshot.queryParams?.['tab'];
      returnUrl = updateReturnUrlBasedOnTab(returnUrl, tab);

      removeSelectedSideNav();
      this.router.navigateByUrl(returnUrl, {
        replaceUrl: true
      });
      return;
    }
    this.generateQueryParamFilter(keepTaskId);
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: this.currentTask.status.toLowerCase(),
      currentTask: null
    });
    if (this.currentTaskGroupId)
      this.taskGroupService.keepExpandState$.next(true);
    this.taskGroupService.handleAddValueExpandGroup(this.currentTaskGroupId);
  }

  generateQueryParamFilter(keepTaskId: boolean) {
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
      .pipe(takeUntil(this.unsubscribe))
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
                  (user) => user.id === this.currentUser$?.value?.id
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

  onConfirmEdit() {
    this.taskService
      .updateTaskTitle(
        this.currentTask.id,
        this.selectedTask.value?.titleName ||
          (this.selectedTask as any).titleName
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentTask.title =
            this.selectedTask.value?.titleName ||
            (this.selectedTask as any).titleName;
          this.resetSelectedTask(this.currentTask);
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: {
              ...this.headerService.headerState$.value.currentTask,
              title: this.currentTask.title
            }
          });
          this.taskService.reloadTaskArea$.next(true);
        }
      });
  }

  onConfirmCreate() {
    if (!this.taskNameCreateForm.valid) {
      return;
    }
    this.taskService
      .createTaskName(this.getTaskNameOnCreate, this.getTopicIdOnCreate)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res: TaskName) => {
          if (res) {
            this.taskNameCreateForm.reset();
            this.addNewCreatedTaskNameToList(res);
            this.taskNameList = this.taskNameList.filter(
              (el) => el.value.topicId === this.selectedTask.value.topicId
            );
          }
        }
      });
  }

  getListTasksData(currentTask: TaskItem) {
    let taskIds: string[] = [];
    const tasksData: TaskDataPayloadChangeStatus[] = [];
    if (currentTask) {
      taskIds.push(currentTask.id);
      tasksData.push({
        id: currentTask.id,
        conversationId:
          currentTask.conversationId || currentTask.conversations?.[0]?.id,
        taskType: currentTask.taskType
      });
    }
    return { taskIds, tasksData };
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirmModal = status;
  }

  resetSelectedTask(task: TaskItem) {
    if (
      !this.selectedTask ||
      !this.selectedTask.value ||
      this.selectedTask.value.titleName !== this.currentTask.title
    ) {
      this.selectedTask = {
        ...this.selectedTask,
        label: task.title,
        value: {
          titleName: task.title,
          topicId: task.topicId
        },
        group: task.status
      };
    }
  }

  deleteTask(event: boolean) {
    this.isShowQuitConfirmModal = false;
    if (!event) return;
    const { taskIds, tasksData } = this.getListTasksData(
      this.headerService.headerState$.value?.currentTask
    );
    const conversationId =
      this.headerService.headerState$.value?.currentTask?.conversationId ||
      this.headerService.headerState$.value?.currentTask?.conversations?.[0]
        ?.id;
    this.isLoadingSkeleton = true;

    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.deleted)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const dataForToast = {
          conversationId,
          taskId: taskIds[0],
          isShowToast: true,
          type: SocketType.changeStatusTask,
          mailBoxId: this.currentTask.mailBoxId,
          taskType: TaskType.MESSAGE,
          status: TaskStatusType.deleted,
          pushToAssignedUserIds: []
        };

        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE
        ) {
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        } else {
          this.toastCustomService.openToastCustom(
            { ...dataForToast, taskType: TaskType.TASK, conversationId: null },
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          this.onBack();
        }

        if (res) {
          if (this.currentTask?.id) {
            this.taskService.currentTask$.next({
              ...this.currentTask,
              status: TaskStatusType.deleted
            });
            this.headerService.headerState$.next({
              ...this.headerService.headerState$.value,
              currentTask: {
                ...this.currentTask,
                status: TaskStatusType.deleted
              },
              currentStatus: TaskStatusType.deleted
            });
            this.conversationService.reloadConversationList.next(true);
          } else {
            this.taskService.removeTasks$.next(taskIds);
          }
          this.isLoadingSkeleton = false;
        }
      });
  }

  subscribeToSocketTaskChanges() {
    this.websocketService.onSocketTask
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const data = res;
        if (
          data &&
          data.type === SocketType.assignTask &&
          data.id &&
          data.id === this.currentTask?.id
        ) {
          this.taskService.currentTask$.next(data);
        }
      });
    this.websocketService.onSocketJob
      .pipe(
        filter((res) => Boolean(res && res.taskId === this.currentTask?.id)),
        takeUntil(this.unsubscribe),
        distinctUntilChanged()
      )
      .subscribe((res) => {
        this.taskService.reloadTaskDetail.next(true);
      });
  }

  subscribeRouterEvent() {
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.isDetailPage = rs.url.includes('detail');
        this.showBtnNewMessage =
          rs.url.includes('messages') && !rs.url.includes('app-messages');
        this.showBtnNewTask =
          rs.url.includes('tasks') && !rs.url.includes('detail');
        this.isTeamPage = rs.url.includes('settings/team');
      }
    });
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          this.crmSystemId = rs?.CRM;
        }
      });
  }

  getHeaderState() {
    this.isLoadingSkeleton = true;
    this.headerService.headerState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentStatus = res.currentStatus?.toLowerCase() || res?.title;
        if (res.currentTask) {
          this.currentTask = res.currentTask;
          this.isTaskRoute =
            window.location.href.includes(TaskType.TASK) ||
            this.currentTask.taskType === TaskType.TASK;
          this.handleCurrentTask(res.currentTask);
        } else {
          this.handleDefaultState();
        }
        this.toggleActiveClassToSideNavItem();
      });
  }

  public handleCurrentTask(currentTask: TaskItem) {
    this.currentTask = currentTask;
    this.title.setValue(currentTask.title || null);
    this.resetSelectedTask(currentTask);
    this.currentTaskDeleted = this.taskService.checkIfCurrentTaskDeleted();
    this.status = this.transform(currentTask.status, currentTask.taskType);
    const isDeletedMessage =
      currentTask.status.toLowerCase() === TaskStatusTypeLC.deleted &&
      currentTask.taskType === TaskType.MESSAGE;
    const isDeletedTask =
      currentTask.status.toLowerCase() === TaskStatusTypeLC.deleted &&
      currentTask.taskType === TaskType.TASK;

    if (isDeletedMessage) {
      this.dataSelectMessage = this.originalDataSelectMessage.filter(
        (status: string) => status !== TaskStatusTypeLC.resolved
      );
    } else {
      this.dataSelectMessage = this.originalDataSelectMessage;
    }

    if (isDeletedTask) {
      this.dataSelectTask = this.originalDataSelectTask.filter(
        (status: string) => status !== TaskStatusTypeLC.completed
      );
    } else {
      this.dataSelectTask = this.originalDataSelectTask;
    }
  }

  public transform(value: string, taskType: TaskType) {
    if (!value) return value;
    value = value.toLowerCase();
    let status: string;

    switch (value.toLowerCase()) {
      case TaskStatusTypeLC.inprogress:
        status =
          taskType === TaskType.MESSAGE
            ? TaskStatusTypeLC.open
            : TaskStatusTypeLC.inprogress;
        break;
      case TaskStatusTypeLC.deleted:
        status =
          taskType === TaskType.MESSAGE ? value : TaskStatusTypeLC.cancelled;
        break;
      case TaskStatusTypeLC.completed:
        status =
          taskType === TaskType.MESSAGE ? TaskStatusTypeLC.resolved : value;
        break;
      default:
        status = value.charAt(0).toUpperCase() + value.slice(1);
    }

    return status;
  }

  private handleDefaultState() {
    this.currentTask = null;
  }

  handleOpenModalPeople() {
    this.isShowModalPeople = true;
  }

  isCloseModalAddNote(e) {
    this.isShowModalAddNote = false;
    this.isShowModalPeople = false;
  }

  isShowModalAdd($event) {
    this.isShowModalAddNote = true;
  }

  statusProperty($event) {
    this.isExpandProperty = $event;
  }

  statusExpandProperty($event) {
    this.isExpandProperty = $event;
  }

  onSubmitAddNote(body) {
    this.isShowPersonMd = true;
    this.isShowModalAddNote = false;
  }

  handlleBackAddNote(e) {
    this.isShowModalAddNote = e;
    this.isShowPersonMd = true;
  }

  onShowPopupAssign(event: boolean) {
    if (!event) return;
    if (this.taskService.checkIfCurrentTaskDeleted()) return;
    this.assignAttachBoxState = !this.assignAttachBoxState;
    const token = this.elr.nativeElement.getBoundingClientRect();
    const currentTask = this.taskService.currentTask$.value;
    this.selectingUserIdListInTask =
      this.taskService.getListOfUserIdAssignedTask(currentTask.assignToAgents);
    this.currentAssignButton = this.elr.nativeElement;
    this.attachBoxPosition = {
      left: token.left + 20,
      top:
        token.top +
        (currentTask.property?.streetline?.length >
        STREETLINE_MAX_LENGTH_PER_LINE
          ? 148
          : 134),
      bottom: 0
    };
  }

  subscribeNetworkConnect() {
    merge(of(null), fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => (this.isConnectNetwork = status));
  }

  handleOpenPropertyProfile() {
    const { id } = this.currentTask?.property || {};
    if (this.propertyStatus === EPropertyStatus.deleted || !id) return;
    this.visiblePropertyProfile = true;
  }

  protected readonly ETypePage = ETypePage;

  get currentTask$() {
    return this.taskService.currentTask$;
  }
}
