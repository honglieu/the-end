import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
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
  takeUntil
} from 'rxjs';
import { agencies, conversations, users } from 'src/environments/environment';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ApiService } from '@services/api.service';
import { Auth0Service } from '@services/auth0.service';
import { UserType } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { LocalStorageService } from '@services/local.storage';
import { MessageService } from '@services/message.service';
import { NavigatorService } from '@services/navigator.service';
import { NotificationService } from '@services/notification.service';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { NotificationTabEnum } from '@shared/enum/notification.enum';
import { SocketType } from '@shared/enum/socket.enum';
import {
  TaskStatusType,
  TaskStatusTypeLC,
  TaskType
} from '@shared/enum/task.enum';
import { UserTypeEnum } from '@shared/enum/user.enum';
import {
  TaskDataPayloadChangeStatus,
  TaskItem,
  TaskItemDropdown,
  TaskName,
  TaskNameItem
} from '@shared/types/task.interface';
import { TeamsByProperty } from '@shared/types/team.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { CurrentUser, ICurrentUser } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu: TriggerMenuDirective;
  public unsubscribe = new Subject<void>();
  newTaskPopupState = false;
  menuState = false;
  title: string;
  currentStatus: string;
  currentTask: TaskItem;
  currentTaskDeleted = false;
  taskNameCreateForm: FormGroup;
  taskStatusType = TaskStatusTypeLC;
  isShowQuitConfirmModal = false;
  showTaskCompleteState = false;
  editLeadTitle = false;
  taskMode: 'edit' | 'create' = 'edit';
  selectedTask: TaskItemDropdown;
  taskNameList: TaskItemDropdown[] = [];
  selectTopicItems: TaskNameItem[] = [];
  listTaskName: TaskItemDropdown[];
  targetConvId = '';
  isEditPopup = false;
  isAddDuplicate = false;
  ModalPopupPosition = ModalPopupPosition;
  completeStep = 1;
  userInfo: CurrentUser;
  iconURL = '';
  tooltipText = '';
  UserType = UserType;
  TaskStatusTypeLC = TaskStatusTypeLC;
  taskStatus = TaskStatusType;
  public showBtnNewMessage: boolean = false;
  resetSendMessageModal: any;
  selectedFiles: any[];
  countCheckbox: number;
  selectedUser: any[];
  TaskType = TaskType;
  private subscriber = new Subject<void>();
  public location = window.location;
  showBtnNewTask: boolean;
  waitToSetValue1: NodeJS.Timeout;
  public isShowMoveConversation: boolean;
  public isDetailPage: boolean;
  public stateCurrentTask: string;
  public isTeamPage: boolean = false;
  currentUser$: BehaviorSubject<ICurrentUser> = this.userService.selectedUser;
  private subscribers = new Subject<void>();
  public isAgencyAdmin: boolean = false;
  public isOpenInviteModal: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public isAdmin = false;
  currentMailboxId: string;

  unHappyStatus: UnhappyStatus;
  isUnHappyPath = false;
  private LAZY_LOAD_TASK = 50;
  isLead: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private readonly auth0Service: Auth0Service,
    private readonly storage: LocalStorageService,
    public readonly sharedService: SharedService,
    private readonly elr: ElementRef,
    private apiService: ApiService,
    private userService: UserService,
    public taskService: TaskService,
    private popupService: PopupService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    private propertyService: PropertiesService,
    private loadingService: LoadingService,
    public notificationService: NotificationService,
    public toatrService: ToastrService,
    private messageService: MessageService,
    private readonly agencyService: AgencyService,
    private websocketService: RxWebsocketService,
    private navigatorService: NavigatorService,
    public inboxService: InboxService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (!mailBoxId) return;
        this.currentMailboxId = mailBoxId;
      });

    this.userService.selectedUser
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.userInfo = res;
        }
      });
    this.headerService.headerState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentStatus = res.currentStatus?.toLowerCase() || res?.title;
        if (res.currentTask) {
          this.currentTask = res.currentTask;
          res.currentTask?.title && (this.title = res.currentTask?.title);
          this.resetSelectedTask(res.currentTask);
          this.currentTaskDeleted =
            this.taskService.checkIfCurrentTaskDeleted();
        } else {
          this.currentTask = null;
          this.title =
            res.title === TaskStatusTypeLC.inprogress
              ? 'in progress'
              : res.title;
        }
        this.toggleActiveClassToSideNavItem();
        this.getIcon(
          res.currentTask?.status.toLowerCase() || res.currentStatus
        );
      });
    this.showBtnNewMessage =
      !(this.route.snapshot.queryParamMap['type'] === TaskType.MESSAGE) &&
      window.location.href.includes('messages');
    this.showBtnNewTask =
      !(this.route.snapshot.queryParamMap['type'] === TaskType.TASK) &&
      window.location.href.includes('tasks');
    this.isDetailPage = window.location.href.includes('detail');
    this.isTeamPage = window.location.href.includes('settings/team');
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.isDetailPage = rs.url.includes('detail');
        this.showBtnNewMessage = rs.url.includes('messages');
        this.showBtnNewTask =
          rs.url.includes('tasks') && !rs.url.includes('detail');
        this.isTeamPage = rs.url.includes('settings/team');
      }
    });
    this.router.setUpLocationChangeListener();

    this.taskService.currentTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.unHappyStatus = res.unhappyStatus;
          this.isUnHappyPath = res.isUnHappyPath;
          if (res.taskType === TaskType.TASK)
            this.stateCurrentTask = res.taskNameRegion?.regionName || '';
          else this.stateCurrentTask = '';
        }
      });

    this.websocketService.onSocketTask
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        debounceTime(500)
      )
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

    this.initForm();
    this.getAndSetAgencyAdminRole();
    this.checkAdmin();
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

  removeSelectedSideNav() {
    const iconList = Array.from(
      document.getElementsByClassName('inbox-sub-item')
    );
    iconList.forEach((icon) => {
      icon.classList.remove('nav-item--selected');
    });
  }

  ngOnDestroy(): void {
    this.clearAllOfTimer();
  }

  clearAllOfTimer() {
    clearTimeout(this.waitToSetValue1);
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

  closeNotificationList() {
    this.headerService.isOpenNotificationList.next(false);
  }

  closeCompleteTask() {
    if (this.completeStep === 2) {
      setTimeout(() => {
        this.showTaskCompleteState = false;
        this.completeStep = 1;
      }, 3000);
    } else {
      this.showTaskCompleteState = false;
    }
  }

  confirmCompleteTask(oldStatus: string) {
    const { taskIds, tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );
    const conversationId =
      this.headerService.headerState$.value?.currentTask?.conversationId ||
      this.headerService.headerState$.value?.currentTask?.conversations?.[0]
        ?.id;
    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.completed)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const dataForToast = {
          conversationId,
          taskId: taskIds[0],
          isShowToast: true,
          type: SocketType.changeStatusTask,
          mailBoxId: this.currentMailboxId,
          taskType: TaskType.MESSAGE,
          status: TaskStatusType.completed,
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
            { ...dataForToast, taskType: TaskType.TASK },
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        }
        if (!res) return;
        if (this.currentTask?.id) {
          this.taskService.currentTask$.next({
            ...this.currentTask,
            status: TaskStatusType.completed
          });
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: {
              ...this.currentTask,
              status: TaskStatusType.completed
            },
            currentStatus: TaskStatusType.completed
          });
          const currentConversation =
            this.conversationService.currentConversation?.getValue();
          if (
            currentConversation &&
            currentConversation?.status !== EConversationType.resolved
          ) {
            this.conversationService.trudiChangeConversationStatus(
              EMessageType.solved
            );
            this.conversationService.setUpdatedConversation(
              currentConversation.id,
              EConversationType.resolved
            );
          }
          this.conversationService.reloadConversationList.next(true);
        } else {
          // this.taskService.reloadTaskList$.next(true);
          this.taskService.removeTasks$.next(taskIds);
        }
        this.completeStep = 2;
        this.closeCompleteTask();
        this.loadingService.stopLoading();
      });
  }

  onClickBell() {
    let isOpened = this.headerService.isOpenNotificationList.getValue();
    if (!isOpened)
      this.notificationService.activeTab$.next(NotificationTabEnum.UNREAD);
    this.headerService.isOpenNotificationList.next(!isOpened);
  }

  onClickBtn() {
    this.loadingService.onLoading();
    switch (this.currentStatus) {
      case TaskStatusTypeLC.completed:
      case TaskStatusTypeLC.deleted:
        this.reOpenTask();
        break;
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
      case TaskStatusTypeLC.mymessages:
      case TaskStatusTypeLC.teammessages:
      case TaskStatusTypeLC.myTask:
      case TaskStatusTypeLC.teamTask:
        this.confirmCompleteTask(this.currentStatus);
        break;
      default:
        break;
    }
  }

  onDeleteTask() {
    let isFromCompletedSection;
    if (
      this.currentStatus === TaskStatusTypeLC.inprogress ||
      this.currentStatus === TaskStatusTypeLC.unassigned
    ) {
      isFromCompletedSection = false;
    } else if (this.currentStatus === TaskStatusTypeLC.completed) {
      isFromCompletedSection = true;
    }
    this.popupService.fromDeleteTask.next({
      display: true,
      isFromCompletedSection
    });
    this.showQuitConfirm(true);
  }

  onForwardEmail() {
    const conversation = this.conversationService.currentConversation.value;
    this.messageService.requestForwardEmailHeader.next(conversation);
  }

  getPathRoute() {
    const url = new URL('http://***' + this.router.url);
    const type = url.searchParams.get('type');
    if (type === 'MESSAGE') {
      return 'messages';
    }
    return 'tasks';
  }

  onBack() {
    const returnUrl = this.navigatorService.getReturnUrl();
    if (returnUrl) {
      this.removeSelectedSideNav();
      this.router.navigateByUrl(returnUrl, {
        replaceUrl: true
      });

      return;
    }
    if (this.taskService.currentTask$.value?.taskType) {
      this.router.navigate(
        [
          `${
            this.taskService.currentTask$.value.taskType.toLowerCase() + 's'
          }/${this.headerService.headerState$.value?.currentTask.groupType.toLowerCase()}`
        ],
        {
          relativeTo: this.route
        }
      );
    }

    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: this.currentTask.status.toLowerCase(),
      currentTask: null
    });
  }

  onCancelOfPopupPressed() {
    this.taskNameCreateForm.reset();
    if (this.taskMode === 'edit') {
      this.resetSelectedTask(this.currentTask);
      this.editLeadTitle = false;
    } else {
      this.resetSelectedTask(this.currentTask);
      this.taskMode = 'edit';
    }
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
          this.editLeadTitle = false;
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
            this.isAddDuplicate = false;
            this.taskMode = 'edit';
            this.taskNameCreateForm.reset();
            this.addNewCreatedTaskNameToList(res);
            this.taskNameList = this.taskNameList.filter(
              (el) => el.value.topicId === this.selectedTask.value.topicId
            );
          }
        },
        error: (err) => {
          this.isAddDuplicate = true;
        }
      });
  }

  onTaskSelectChanged(e: TaskItemDropdown) {
    this.selectedTask = e;
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select input'
    );
    searchInput.value = e.value.titleName || '';
    searchInput.blur();
  }

  onOpenCreateMode() {
    this.isAddDuplicate = false;
    this.taskMode = 'create';
  }

  reOpenTask() {
    const { taskIds, tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );
    const conversationId =
      this.headerService.headerState$.value?.currentTask?.conversationId ||
      this.headerService.headerState$.value?.currentTask?.conversations?.[0]
        ?.id;
    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.inprogress)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const currentTaskType =
          this.headerService.headerState$.value.currentStatus;
        const dataForToast = {
          conversationId,
          taskId: taskIds[0],
          isShowToast: true,
          type: SocketType.changeStatusTask,
          mailBoxId: this.currentMailboxId,
          taskType: TaskType.MESSAGE,
          status: TaskStatusType.inprogress,
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
            { ...dataForToast, taskType: TaskType.TASK },
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        }
        if (!res) return;
        if (this.currentTask?.id) {
          this.taskService.currentTask$.next({
            ...this.currentTask,
            status: TaskStatusType.inprogress
          });
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: {
              ...this.currentTask,
              status: TaskStatusType.inprogress
            },
            currentStatus: TaskStatusType.inprogress
          });
          const currentConversation =
            this.conversationService.currentConversation?.getValue();
          if (currentConversation) {
            this.conversationService.trudiChangeConversationStatus(
              EMessageType.reopened
            );
            this.conversationService.setUpdatedConversation(
              currentConversation.id,
              EConversationType.reopened
            );
          }
          this.conversationService.reloadConversationList.next(true);
        } else {
          this.taskService.removeTasks$.next(taskIds);
        }
        this.conversationService.reloadConversationList.next(true);
        this.loadingService.stopLoading();
      });
  }

  hideLabelSelectTask() {
    const searchLabel = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select .ng-value-label'
    );
    searchLabel.textContent = '';
  }

  getListTaskData(currentTask: TaskItem) {
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

  handleNavigateToUserProfile() {
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.getValue(),
      title: 'profile settings',
      currentTask: null
    });
    this.router.navigate([`user-setting/profile`]);
  }

  handleNavigateToConsoleSetting() {
    this.menu.close();
    this.router.navigate(['controls']);
  }

  handleNavigateToHelpCentre() {
    window.open('https://trudi.helpjuice.com/', '_blank');
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirmModal = status;
  }

  searchNotFound() {
    this.isEditPopup = true;
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select input'
    );
    if (searchInput.value === '' || !searchInput.value) {
      this.hideLabelSelectTask();
    }
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

  logout() {
    this.deleteAllCookies();
    if (this.isSafariBrowser()) {
      const token = localStorage.getItem('_idToken');
      if (token) {
        this.apiService
          .postAPI(conversations, 'delete-token', {
            token,
            platform: 'BROWSER'
          })
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(() => {
            this.auth0Service.auth0.logout({
              returnTo: window.location.origin
            });
            window.location.href = '/';
            this.storage.clearLocalStorage();
          });
      }
      return;
    }
    this.auth0Service
      .logout()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        window.location.href = '/';
        this.storage.clearLocalStorage();
      });
  }

  deleteAllCookies() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  deleteTask(event: boolean) {
    this.isShowQuitConfirmModal = false;
    if (!event) return;
    const { taskIds, tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );
    this.loadingService.onLoading();

    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.deleted)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const dataForToast = {
          taskId: this.currentTask?.id,
          isShowToast: true,
          type: SocketType.changeStatusTask,
          mailBoxId: this.currentMailboxId,
          taskType: TaskType.TASK,
          status: TaskStatusType.deleted,
          pushToAssignedUserIds: []
        };

        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE
        ) {
          this.toastCustomService.openToastCustom(
            { ...dataForToast, taskType: TaskType.MESSAGE },
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        } else {
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
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
            const currentConversation =
              this.conversationService.currentConversation?.getValue();
            if (
              currentConversation &&
              currentConversation?.status !== EConversationType.resolved
            ) {
              this.conversationService.trudiChangeConversationStatus(
                EMessageType.solved
              );
              this.conversationService.setUpdatedConversation(
                currentConversation.id,
                EConversationType.resolved
              );
            }
            this.conversationService.reloadConversationList.next(true);
          } else {
            this.taskService.removeTasks$.next(taskIds);
          }
          this.loadingService.stopLoading();
        }
      });
  }

  isSafariBrowser() {
    return (
      navigator.userAgent.indexOf('Safari') > -1 &&
      navigator.userAgent.indexOf('Chrome') <= -1
    );
  }

  getIcon(status: string) {
    switch (status) {
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
        this.iconURL = '/assets/icon/resolve-task.svg';
        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE
        ) {
          this.tooltipText = 'Resolve';
        } else {
          this.tooltipText = 'Mark as completed';
        }
        break;
      case TaskStatusTypeLC.mymessages:
        this.iconURL = '/assets/icon/resolve-task.svg';
        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE
        ) {
          this.tooltipText = 'Resolve';
        } else {
          this.tooltipText = 'Mark as completed';
        }
        break;
      case TaskStatusTypeLC.teammessages:
        this.iconURL = '/assets/icon/resolve-task.svg';
        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE
        ) {
          this.tooltipText = 'Resolve';
        } else {
          this.tooltipText = 'Mark as completed';
        }
        break;
      case TaskStatusTypeLC.myTask:
      case TaskStatusTypeLC.teamTask:
        this.iconURL = '/assets/icon/resolve-task.svg';
        if (
          this.showBtnNewMessage ||
          this.taskService.currentTask$?.value?.taskType === TaskType.TASK
        ) {
          this.tooltipText = 'Resolve';
        } else {
          this.tooltipText = 'Mark as completed';
        }
        break;
      case TaskStatusTypeLC.deleted:
        this.iconURL = '/assets/icon/reopen-icon-outline.svg';
        if (this.showBtnNewMessage) {
          this.tooltipText = 'Reopen';
        } else {
          this.tooltipText = 'Reopen';
        }
        break;
      case TaskStatusTypeLC.completed:
        this.iconURL = '/assets/icon/reopen-icon-outline.svg';
        this.tooltipText = 'Reopen';
        break;
      default:
        break;
    }
  }

  handleClickUserAvatar() {
    this.menuState = !this.menuState;
    this.isLead = this.userService.userInfo$?.value?.type === UserTypeEnum.LEAD;
  }

  getAndSetAgencyAdminRole() {
    combineLatest(
      this.currentUser$.pipe(takeUntil(this.subscribers)),
      this.companyService
        .getCurrentCompanyId()
        .pipe(takeUntil(this.subscribers), distinctUntilChanged())
    ).subscribe(([user, companyId]) => {
      if (!user?.agencyAgents || !companyId) return;
      this.isAgencyAdmin = this.userService.checkIsAgencyAdmin(
        companyId,
        user.agencyAgents
      );
    });
  }

  checkAdmin() {
    this.apiService.getAPI(users, 'current-user').subscribe((res) => {
      this.isAdmin = res.isAdministrator;
      this.loadingService.stopLoading();
    });
  }

  handleOpenInviteModal() {
    this.isOpenInviteModal = true;
  }

  handleCloseInviteModal() {
    this.isOpenInviteModal = false;
  }

  onInviteTeamMember(body) {
    this.apiService
      .getAPI(agencies, `team?page=${0}&size=${100}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: TeamsByProperty) => {
          this.loadingService.stopLoading();
        },
        () => {
          this.loadingService.stopLoading();
        }
      );
  }
}
