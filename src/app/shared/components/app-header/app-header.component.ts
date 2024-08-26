import { AgencyService } from '@services/agency.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { conversations } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { UserService } from '@services/user.service';
import { Auth0Service } from '@services/auth0.service';
import { LocalStorageService } from '@services/local.storage';
import { HeaderService } from '@services/header.service';
import {
  TaskDataPayloadChangeStatus,
  TaskItem,
  TaskItemDropdown,
  TaskName,
  TaskNameItem
} from '@shared/types/task.interface';
import { SharedService } from '@services/shared.service';
import { TaskStatusType, TaskStatusTypeLC } from '@shared/enum/task.enum';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { PopupService } from '@services/popup.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { CurrentUser } from '@shared/types/user.interface';
import { LoadingService } from '@services/loading.service';
import { NotificationService } from '@services/notification.service';
import { NotificationTabEnum } from '@shared/enum/notification.enum';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { UserType } from '@services/constants';

declare const loader: any;
@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit {
  @ViewChild('menu') menu: TriggerMenuDirective;
  public unsubscribe = new Subject<void>();
  public isShowSearchBox: boolean = true;
  menuState = false;
  title: string;
  currentStatus: string;
  currentUrlStatus: string;
  currentTask: TaskItem;
  currentTaskDeleted = false;
  buttonText: string;
  searchFormControl$ = new FormControl(null);
  taskStatusType = TaskStatusTypeLC;
  isShowQuitConfirmModal = false;
  showTaskCompleteState = false;
  editLeadTitle = false;
  taskMode: 'edit' | 'create' = 'edit';
  selectedTask: TaskItemDropdown;
  taskNameList: TaskItemDropdown[] = [];
  selectTopicItems: TaskNameItem[] = [];
  isEditPopup = false;
  isAddDuplicate = false;
  taskNameCreateForm: FormGroup;
  ModalPopupPosition = ModalPopupPosition;
  completeStep = 1;
  userInfo: CurrentUser;
  iconURL = '';
  UserType = UserType;
  completeTaskContent = {
    step1Text: 'Mark this task as completed?',
    step2Text:
      "This task is now completed. You will find it in the 'Completed' list",
    step1SubText:
      'To complete task, all open conversations will be marked as resolved.',
    step2SubText: ''
  };
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
    private agencyService: AgencyService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    private loadingService: LoadingService,
    public notificationService: NotificationService
  ) {
    router.events
      .pipe(
        takeUntil(this.unsubscribe),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.isShowSearchBox = event.url.toString().includes('tasks');
      });
  }

  ngOnInit() {
    this.isShowSearchBox = this.router.url.toString().includes('tasks');
    this.userService.selectedUser
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.userInfo = res;
        }
      });

    this.taskService.filterTaskState$
      .pipe(
        distinctUntilChanged((previous, current) => {
          return previous?.search === current?.search;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((state) => {
        state &&
          this.searchFormControl$.setValue(state.search, { emitEvent: false });
      });

    this.headerService.headerState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentStatus =
            res.currentTask?.status.toLowerCase() || res.title;
          this.currentUrlStatus = res.title;
          if (res.currentTask) {
            this.currentTask = res.currentTask;
            this.title = res.currentTask?.title;
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
          this.getButtonText(
            res.currentTask?.status.toLowerCase() || res.title
          );
          this.getIcon(res.currentTask?.status.toLowerCase() || res.title);
        }
      });

    this.searchFormControl$.valueChanges
      .pipe(takeUntil(this.unsubscribe), debounceTime(500))
      .subscribe((searchValue) => {
        this.taskService.filterTaskState$.next({
          ...this.taskService.filterTaskState$.value,
          search: searchValue
        });
      });
    this.initForm();
  }

  initForm() {
    this.taskNameCreateForm = new FormGroup({
      taskName: new FormControl('', Validators.required),
      topicId: new FormControl('', Validators.required)
    });
  }

  getIcon(status: string) {
    switch (status) {
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
        this.iconURL = '/assets/icon/icon-completed-primary.svg';
        break;
      case TaskStatusTypeLC.deleted:
      case TaskStatusTypeLC.completed:
        this.iconURL = '/assets/icon/icon-reopen-primary.svg';
        break;
      default:
        break;
    }
  }

  getButtonText(title: string) {
    switch (title) {
      case TaskStatusTypeLC.completed:
        this.buttonText = 'Reopen Task';
        break;
      case TaskStatusTypeLC.deleted:
        this.buttonText = 'Move to In Progress';
        break;
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
        this.buttonText = 'Mark as completed';
        break;
      default:
        break;
    }
  }

  onClickBtn() {
    switch (this.currentStatus) {
      case TaskStatusTypeLC.completed:
      case TaskStatusTypeLC.deleted:
        this.reOpenTask();
        break;
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
        this.showTaskCompleteState = !this.showTaskCompleteState;
        break;
      default:
        break;
    }
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

  confirmCompleteTask() {
    const { taskIds, tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );

    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.completed)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          if (this.currentTask?.id) {
            this.taskService.currentTask$.next({
              ...this.currentTask,
              status: TaskStatusType.completed,
              assignToAgents: [
                ...this.headerService.headerState$.value.currentTask
                  .assignToAgents,
                {
                  firstName: this.userInfo.firstName,
                  lastName: this.userInfo.lastName,
                  googleAvatar: this.userInfo.googleAvatar,
                  id: this.userInfo.id,
                  fullName: this.sharedService.displayName(
                    this.userInfo.firstName,
                    this.userInfo.lastName
                  )
                }
              ]
            });
            this.headerService.headerState$.next({
              ...this.headerService.headerState$.value,
              currentTask: {
                ...this.currentTask,
                status: TaskStatusType.completed
              }
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
            this.taskService.reloadTaskList$.next(true);
          }
          this.completeStep = 2;
          this.closeCompleteTask();
        }
      });
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

  deleteTask(event: boolean) {
    if (!event) return;
    const { tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );
    this.loadingService.onLoading();

    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.deleted)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          if (this.currentTask?.id) {
            this.taskService.currentTask$.next({
              ...this.currentTask,
              status: TaskStatusType.deleted,
              assignToAgents: [
                ...this.headerService.headerState$.value.currentTask
                  .assignToAgents,
                {
                  firstName: this.userInfo.firstName,
                  lastName: this.userInfo.lastName,
                  googleAvatar: this.userInfo.googleAvatar,
                  id: this.userInfo.id,
                  fullName: this.sharedService.displayName(
                    this.userInfo.firstName,
                    this.userInfo.lastName
                  )
                }
              ]
            });
            this.headerService.headerState$.next({
              ...this.headerService.headerState$.value,
              currentTask: {
                ...this.currentTask,
                status: TaskStatusType.deleted
              }
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
            this.taskService.reloadTaskList$.next(true);
          }
          this.loadingService.stopLoading();
        }
      });
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirmModal = status;
  }

  onEditTaskName() {
    this.taskNameList = this.taskService.createTaskNameList();
    this.editLeadTitle = true;
  }

  onTaskSelectChanged(e: TaskItemDropdown) {
    this.selectedTask = e;
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select input'
    );
    searchInput.value = e.value.titleName || '';
    searchInput.blur();
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

  hideLabelSelectTask() {
    const searchLabel = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select .ng-value-label'
    );
    searchLabel.textContent = '';
  }

  closeTaskName() {
    this.isEditPopup = false;
  }

  compareFn(item: TaskItemDropdown, selected: TaskItemDropdown) {
    return item === selected;
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

  onClose() {
    this.taskNameCreateForm.reset();
    this.resetSelectedTask(this.currentTask);
    this.editLeadTitle = false;
    this.taskMode = 'edit';
  }

  onOpenCreateMode() {
    this.isAddDuplicate = false;
    this.taskMode = 'create';
  }

  get getTaskNameOnCreate() {
    return this.taskNameCreateForm.get('taskName').value;
  }

  get getTopicIdOnCreate() {
    return this.taskNameCreateForm.get('topicId').value;
  }

  onBack() {
    this.router.navigate([`tasks/${this.currentUrlStatus.toLowerCase()}`], {
      relativeTo: this.route
    });

    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: this.currentTask.status.toLowerCase(),
      currentTask: null
    });
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  openOption() {
    this.menuState = !this.menuState;
  }

  isSafariBrowser() {
    return (
      navigator.userAgent.indexOf('Safari') > -1 &&
      navigator.userAgent.indexOf('Chrome') <= -1
    );
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

  reOpenTask() {
    this.loadingService.onLoading();
    const { tasksData } = this.getListTaskData(
      this.headerService.headerState$.value?.currentTask
    );
    this.taskService
      .changeTaskStatusMultiple(tasksData, TaskStatusType.inprogress)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        if (this.currentTask?.id) {
          this.taskService.currentTask$.next({
            ...this.currentTask,
            status: TaskStatusType.inprogress,
            assignToAgents: [
              ...this.headerService.headerState$.value.currentTask
                .assignToAgents,
              {
                firstName: this.userInfo.firstName,
                lastName: this.userInfo.lastName,
                googleAvatar: this.userInfo.googleAvatar,
                id: this.userInfo.id,
                fullName: this.sharedService.displayName(
                  this.userInfo.firstName,
                  this.userInfo.lastName
                )
              }
            ]
          });
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: {
              ...this.currentTask,
              status: TaskStatusType.inprogress
            }
          });
        } else {
          this.taskService.reloadTaskList$.next(true);
        }
        this.conversationService.reloadConversationList.next(true);
        this.loadingService.stopLoading();
      });
  }

  onClickBell() {
    let isOpened = this.headerService.isOpenNotificationList.getValue();
    if (!isOpened)
      this.notificationService.activeTab$.next(NotificationTabEnum.UNREAD);
    this.headerService.isOpenNotificationList.next(!isOpened);
  }

  closeNotificationList() {
    this.headerService.isOpenNotificationList.next(false);
  }
}
